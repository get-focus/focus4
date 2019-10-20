import "intersection-observer";

import classNames from "classnames";
import {AnimatePresence} from "framer-motion";
import {debounce, memoize, range} from "lodash";
import {action, autorun, observable} from "mobx";
import {disposeOnUnmount, observer, useObserver} from "mobx-react";
import {animate} from "popmotion";
import {cloneElement, Component, forwardRef, HTMLProps, Key, PropsWithChildren, ReactNode, Ref} from "react";
import {createPortal, findDOMNode} from "react-dom";
import ResizeObserverPolyfill from "resize-observer-polyfill";
import styler, {Styler} from "stylefire";

import {CSSProp, ScrollableContext, springTransition, themr} from "@focus4/styling";
import {Button} from "@focus4/toolbox";

import {ButtonBackToTop} from "./button-back-to-top";
export {ButtonBttCss, buttonBttCss} from "./button-back-to-top";
import {Header} from "./header";

import scrollableCss, {ScrollableCss} from "./__style__/scrollable.css";
export {scrollableCss, ScrollableCss};
const Theme = themr("scrollable", scrollableCss);

const ResizeObserver = (window as any).ResizeObserver || ResizeObserverPolyfill;

export interface ScrollableProps {
    /** Offset avant l'apparition du bouton de retour en haut. Par défaut : 300. */
    backToTopOffset?: number;
    /** Children. */
    children?: ReactNode;
    /** Classe CSS. */
    className?: string;
    /** @internal */
    /** Ref vers le div container. */
    innerRef?: Ref<HTMLDivElement>;
    /** Cache le bouton de retour en haut. */
    hideBackToTop?: boolean;
    /** Comportement du scroll. Par défaut : "smooth" */
    scrollBehaviour?: ScrollBehavior;
    /** Reset le scroll (à 0) dès que les children du scrollable changent.  */
    resetScrollOnChildrenChange?: boolean;
    /** CSS. */
    theme?: CSSProp<ScrollableCss>;
}

@observer
class ScrollableComponent extends Component<ScrollableProps> {
    @observable.ref header?: HTMLElement;
    @observable.ref headerProps?: HTMLProps<HTMLElement>;

    @observable.ref containerNode!: HTMLDivElement;
    @observable.ref menuNode!: HTMLDivElement;
    @observable.ref scrollableNode!: HTMLDivElement;

    @observable.ref intersectionObserver!: IntersectionObserver;
    @observable.ref mutationObserver!: MutationObserver;
    @observable.ref resizeObserver!: ResizeObserverPolyfill;

    readonly menuStylers = observable.map<Key, Styler>({}, {deep: false});
    readonly menuParentNodes = observable.map<Key, HTMLElement>({}, {deep: false});
    readonly onIntersects = observable.map<Element, (ratio: number, isIntersecting: boolean) => void>([], {
        deep: false
    });

    @observable canDeploy = false;
    @observable hasBtt = false;
    @observable headerHeight = 0;
    @observable isHeaderSticky = false;
    @observable isMenuOpened = true;
    @observable isMenuRetractable = true;
    @observable width = 0;

    /** @see ScrollableContext.registerHeader */
    @action.bound
    registerHeader(nonStickyElement: HTMLElement, canDeploy: boolean) {
        if (canDeploy) {
            this.intersectionObserver.observe(nonStickyElement);
        } else {
            styler(this.menuNode).set({top: this.headerHeight});
        }

        this.canDeploy = canDeploy;
        this.header = nonStickyElement;
        this.isHeaderSticky = !canDeploy;

        return action(() => {
            if (canDeploy) {
                this.intersectionObserver.unobserve(nonStickyElement);
            }

            this.canDeploy = false;
            this.header = undefined;
            this.headerProps = undefined;
            this.isHeaderSticky = false;
        });
    }

    /** @see ScrollableContext.registerHeaderProps */
    @action.bound
    registerHeaderProps(headerProps: HTMLProps<HTMLElement>) {
        this.headerProps = headerProps;
        this.onScroll();
    }

    /** @see ScrollableContext.registerIntersect */
    @action.bound
    registerIntersect(node: HTMLElement, onIntersect: (ratio: number, isIntersecting: boolean) => void) {
        this.onIntersects.set(node, onIntersect);
        this.intersectionObserver.observe(node);

        return () => {
            this.onIntersects.delete(node);
            this.intersectionObserver.unobserve(node);
        };
    }

    /** @see ScrollableContext.scrollTo */
    @action.bound
    scrollTo(options?: ScrollToOptions) {
        const {scrollBehaviour = "smooth"} = this.props;
        this.scrollableNode.scrollTo({behavior: scrollBehaviour, ...options});
    }

    /** @see ScrollableContext.menu */
    @action.bound
    menu(node: JSX.Element, parentNode: HTMLElement | null, retractable = true) {
        if (!parentNode) {
            return null;
        }
        if (!node.key) {
            throw new Error("Un élément du menu d'un Scrollable doit avoir une key.");
        }
        this.menuParentNodes.set(node.key, parentNode);
        this.isMenuRetractable = retractable;
        if (!this.menuStylers.has(node.key)) {
            styler(this.menuNode).set("x", "0%");
            this.isMenuOpened = true;
        }
        return createPortal(cloneElement(node, {ref: this.setRef(node.key)}), this.menuNode);
    }

    /** @see ScrollableContext.portal */
    @action.bound
    portal(node: JSX.Element) {
        return createPortal(node, this.containerNode);
    }

    setRef = memoize((key: Key) => (ref: HTMLElement | null) => {
        if (!ref && this.menuStylers.has(key)) {
            this.menuStylers.delete(key);
            this.menuParentNodes.delete(key);
        } else if (ref && !this.menuStylers.has(key)) {
            const menuRef = styler(ref);
            this.menuStylers.set(key, menuRef);
            menuRef.set({
                marginTop:
                    getOffsetTop(this.menuParentNodes.get(key)!, this.scrollableNode) -
                    this.scrollableNode.scrollTop -
                    this.menuNode.offsetTop
            });
        }
    });

    UNSAFE_componentWillReceiveProps(props: ScrollableProps) {
        if (props.resetScrollOnChildrenChange && props.children !== this.props.children) {
            this.scrollTo({top: 0, behavior: "auto"});
        }
    }

    componentDidMount() {
        this.containerNode = findDOMNode(this) as HTMLDivElement;
        this.scrollableNode.addEventListener("scroll", this.onScroll);
        this.resizeObserver = new ResizeObserver(() => this.onScroll());
        this.resizeObserver.observe(this.scrollableNode);
        this.resizeObserver.observe(this.menuNode);
        this.mutationObserver = new MutationObserver(() => this.onScroll());
        this.mutationObserver.observe(this.scrollableNode, {attributes: true, childList: true, subtree: true});
        this.mutationObserver.observe(this.menuNode, {attributes: true, childList: true, subtree: true});
        this.intersectionObserver = new IntersectionObserver(
            entries =>
                entries.forEach(e => {
                    if (e.target === this.header) {
                        this.isHeaderSticky = !e.isIntersecting;
                    }
                    const onIntersect = this.onIntersects.get(e.target);
                    if (onIntersect) {
                        onIntersect(e.intersectionRatio, e.isIntersecting);
                    }
                }),
            {root: this.scrollableNode, threshold: range(0, 105, 5).map(t => t / 100)}
        );
        styler(this.menuNode).set({top: this.headerHeight});
    }

    componentWillUnmount() {
        this.scrollableNode?.removeEventListener("scroll", this.onScroll);
        this.intersectionObserver?.disconnect();
        this.mutationObserver?.disconnect();
        this.resizeObserver?.disconnect();
    }

    @action.bound
    updateMenuParentNodes(x: string) {
        const per = (+x.replace("%", "") + 100) / 100;
        this.menuParentNodes.forEach(node => (node.style.marginLeft = `${this.menuNode.clientWidth * per}px`));
    }

    @action.bound
    onScroll() {
        this.width = this.scrollableNode.clientWidth;
        this.updateMenuParentNodes(`${styler(this.menuNode).get("x") ?? "0%"}`);
        this.hasBtt = this.scrollableNode.scrollTop + this.headerHeight > (this.props.backToTopOffset || 300);
        if (isIEorEdge()) {
            this.onScrollCoreDebounced();
        } else {
            this.onScrollCore();
        }
    }

    onScrollCoreDebounced = debounce(() => this.onScrollCore(), 50);
    onScrollCore() {
        if (!isIEorEdge()) {
            this.setMenuRefs(this.menuNode.offsetTop);
        } else {
            this.animateMenuRefs(
                parentOffsetTop => parentOffsetTop - this.scrollableNode.scrollTop - this.menuNode.offsetTop
            );
        }
    }

    menuSpring?: {stop: () => void};

    @disposeOnUnmount
    followHeader = autorun(() => {
        if (!this.menuNode) {
            return;
        }

        const menu = styler(this.menuNode);
        const from = menu.get("top");
        const to = this.isHeaderSticky ? this.headerHeight : 0;
        if (this.header) {
            if (this.menuSpring) {
                this.menuSpring.stop();
            }
            if (this.canDeploy && from !== to) {
                this.menuSpring = animate({
                    ...springTransition,
                    from,
                    to,
                    onUpdate: (top: number) => {
                        menu.set({top});
                        if (isIEorEdge()) {
                            this.onScrollCoreDebounced.cancel();
                        }
                    }
                });
            } else {
                menu.set({top: to});
            }
        }

        if (isIEorEdge()) {
            if (this.isHeaderSticky) {
                this.animateMenuRefs(() => 0);
            }
        }
    });

    menuItemsSpring?: {stop: () => void};

    @disposeOnUnmount
    toggleMenu = autorun(() => {
        if (!this.menuNode) {
            return;
        }
        const menu = styler(this.menuNode);

        if (this.menuItemsSpring) {
            this.menuItemsSpring.stop();
        }

        let from = menu.get("x");
        if (from === 0) {
            from = "0%";
        }
        const to = this.isMenuOpened ? "0%" : "-100%";

        if (from !== to) {
            this.menuItemsSpring = animate({
                ...springTransition,
                from,
                to,
                onUpdate: (x: string) => {
                    menu.set({x});
                    this.updateMenuParentNodes(x);
                }
            });
        }
    });

    setMenuRefs(offsetTop: number) {
        this.menuStylers.forEach((menuRef, key) => {
            const parentNode = this.menuParentNodes.get(key)!;
            const marginTop = Math.max(
                0,
                getOffsetTop(parentNode, this.scrollableNode) - this.scrollableNode.scrollTop - offsetTop
            );
            menuRef.set({
                marginTop,
                height: `calc(100% - ${marginTop}px)`
            });
            const buttonMenu = this.menuNode.children.item(this.menuNode.children.length - 1);
            if (buttonMenu?.nodeName === "BUTTON") {
                styler(buttonMenu).set({top: marginTop});
            }
        });
    }

    animateMenuRefs(to: (parentOffsetTop: number) => number) {
        this.menuStylers.forEach((menuRef, key) => {
            const parentNode = this.menuParentNodes.get(key)!;
            const transition = {
                from: menuRef.get("marginTop"),
                to: Math.max(0, to(getOffsetTop(parentNode, this.scrollableNode)))
            };
            if (transition.from !== transition.to) {
                animate({
                    ...springTransition,
                    ...transition,
                    onUpdate: (marginTop: number) => {
                        menuRef.set({
                            marginTop,
                            height: `calc(100% - ${marginTop}px)`
                        });
                        const buttonMenu = this.menuNode.querySelector("button");
                        if (buttonMenu) {
                            styler(buttonMenu).set({top: marginTop});
                        }
                    }
                });
            }
        });
    }

    setHeight = (height: number) => (this.headerHeight = height);
    setMenuNode = (ref: HTMLDivElement | null) => ref && (this.menuNode = ref);
    setScrollableNode = (ref: HTMLDivElement | null) => ref && (this.scrollableNode = ref);

    Header = () =>
        useObserver(() => (
            <AnimatePresence>
                {this.headerProps && this.isHeaderSticky ? (
                    <Header
                        {...this.headerProps}
                        ref={undefined}
                        animated={this.canDeploy}
                        onHeightChange={this.setHeight}
                        style={{width: this.width}}
                    />
                ) : undefined}
            </AnimatePresence>
        ));

    BackToTop = () =>
        useObserver(() => (
            <AnimatePresence>
                {!this.props.hideBackToTop && this.hasBtt ? <ButtonBackToTop /> : undefined}
            </AnimatePresence>
        ));

    render() {
        const {children, className, innerRef} = this.props;
        return (
            <ScrollableContext.Provider
                value={{
                    menu: this.menu,
                    portal: this.portal,
                    registerHeader: this.registerHeader,
                    registerHeaderProps: this.registerHeaderProps,
                    registerIntersect: this.registerIntersect,
                    scrollTo: this.scrollTo
                }}
            >
                <Theme theme={this.props.theme}>
                    {theme => (
                        <div ref={innerRef} className={classNames(theme.container(), className)}>
                            <div className={theme.scrollable()} ref={this.setScrollableNode}>
                                {this.intersectionObserver ? children : null}
                            </div>

                            <div className={theme.menu()} ref={this.setMenuNode}>
                                {this.isMenuRetractable && this.menuParentNodes.size ? (
                                    <Button
                                        icon={`keyboard_arrow_${this.isMenuOpened ? "left" : "right"}`}
                                        className={theme.menuButton()}
                                        onClick={() => (this.isMenuOpened = !this.isMenuOpened)}
                                        ripple={false}
                                    />
                                ) : null}
                            </div>
                            <this.Header />
                            <this.BackToTop />
                        </div>
                    )}
                </Theme>
            </ScrollableContext.Provider>
        );
    }
}

export const Scrollable = forwardRef<HTMLDivElement, PropsWithChildren<ScrollableProps>>((props, ref) => (
    <ScrollableComponent {...props} innerRef={ref} />
));

function isIEorEdge() {
    return navigator.userAgent.match(/(Trident|Edge)/);
}

function getOffsetTop(node: HTMLElement, container: HTMLElement) {
    let distance = node.offsetTop;
    if (node.offsetParent && node.offsetParent !== container) {
        distance += getOffsetTop(node.offsetParent as HTMLElement, container);
    }
    return distance;
}
