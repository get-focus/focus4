import {omit} from "lodash";
import {
    Component,
    ComponentType,
    forwardRef,
    MouseEvent,
    MouseEventHandler,
    ReactNode,
    TouchEvent,
    TouchEventHandler
} from "react";
import {findDOMNode} from "react-dom";

import {CSSProp, ToBem, useTheme} from "@focus4/styling";
import rippleCss, {RippleCss} from "./__style__/ripple.css";
export {rippleCss, RippleCss};

export interface RippleOptions {
    rippleCentered?: boolean;
    rippleMultiple?: boolean;
    ripplePassthrough?: boolean;
    rippleSpread?: number;
    theme?: CSSProp<RippleCss>;
}

export interface RippleProps extends Omit<RippleOptions, "theme"> {
    children?: ReactNode;
    disabled?: boolean;
    onMouseDown?: MouseEventHandler;
    onRippleEnded?: (event: TransitionEvent) => void;
    onTouchStart?: TouchEventHandler;
    ripple?: boolean;
    rippleTheme?: CSSProp<RippleCss>;
}

export function rippleFactory({
    rippleCentered = false,
    rippleMultiple = true,
    ripplePassthrough = true,
    rippleSpread = 2,
    theme: oTheme
}: RippleOptions = {}) {
    return function Ripple<P>(ComposedComponent: ComponentType<P> | string) {
        return forwardRef<RippledComponent<P>, P & RippleProps>((p, ref) => {
            const theme = useTheme("RTRipple", rippleCss, p.rippleTheme, oTheme);
            return (
                <RippledComponent
                    ref={ref}
                    disabled={false}
                    ripple={true}
                    rippleCentered={rippleCentered}
                    rippleMultiple={rippleMultiple}
                    ripplePassthrough={ripplePassthrough}
                    rippleSpread={rippleSpread}
                    {...p}
                    rippleTheme={theme}
                    ComposedComponent={ComposedComponent}
                />
            );
        });
    };
}

interface RippleEntry {
    active: boolean;
    restarting: boolean;
    top: number;
    left: number;
    width: number;
    endRipple: () => void;
}

interface RippleState {
    ripples: {[key: string]: RippleEntry};
}

export class RippledComponent<P> extends Component<
    RippleProps & {rippleTheme: ToBem<RippleCss>} & {ComposedComponent: ComponentType<P> | string},
    RippleState
> {
    state: RippleState = {
        ripples: {}
    };

    currentCount = 0;
    rippleNodes: {[key: string]: HTMLElement} = {};
    touchCache = false;

    componentDidUpdate(_: RippleProps, prevState: RippleState) {
        // If a new ripple was just added, add a remove event listener to its animation
        if (Object.keys(prevState.ripples).length < Object.keys(this.state.ripples).length) {
            this.addRippleRemoveEventListener(this.getLastKey());
        }
    }

    componentWillUnmount() {
        // Remove document event listeners for ripple if they still exists
        Object.keys(this.state.ripples).forEach(key => {
            this.state.ripples[key].endRipple();
        });
    }

    /**
     * Find out a descriptor object for the ripple element being created depending on
     * the position where the it was triggered and the component's dimensions.
     *
     * @param x Coordinate x in the viewport where ripple was triggered
     * @param y Coordinate y in the viewport where ripple was triggered
     */
    getDescriptor(x: number, y: number) {
        const {left, top, height, width} = (findDOMNode(this) as Element).getBoundingClientRect();
        const {rippleCentered, rippleSpread} = this.props;
        return {
            left: rippleCentered ? 0 : x - left - width / 2,
            top: rippleCentered ? 0 : y - top - height / 2,
            width: width * rippleSpread!
        };
    }

    /**
     * Increments and internal counter and returns the next value as a string. It
     * is used to assign key references to new ripple elements.
     */
    getNextKey() {
        this.currentCount = this.currentCount ? this.currentCount + 1 : 1;
        return `ripple${this.currentCount}`;
    }

    /**
     * Return the last generated key for a ripple element. When there is only one ripple
     * and to get the reference when a ripple was just created.
     */
    getLastKey() {
        return `ripple${this.currentCount}`;
    }

    doRipple = () => !this.props.disabled && this.props.ripple;

    handleMouseDown = (event: MouseEvent) => {
        if (this.props.onMouseDown) {
            this.props.onMouseDown(event);
        }
        if (this.doRipple()) {
            const {x, y} = {
                x: event.pageX - (window.scrollX || window.pageXOffset),
                y: event.pageY - (window.scrollY || window.pageYOffset)
            };
            this.animateRipple(x, y, false);
        }
    };

    handleTouchStart = (event: TouchEvent) => {
        if (this.props.onTouchStart) {
            this.props.onTouchStart(event);
        }
        if (this.doRipple()) {
            const {x, y} = {
                x: event.touches[0].pageX - (window.scrollX || window.pageXOffset),
                y: event.touches[0].pageY - (window.scrollY || window.pageYOffset)
            };
            this.animateRipple(x, y, true);
        }
    };

    /**
     * Determine if a ripple should start depending if its a touch event. For mobile both
     * touchStart and mouseDown are launched so in case is touch we should always trigger
     * but if its not we should check if a touch was already triggered to decide.
     *
     * @param isTouch True in case a touch event triggered the ripple false otherwise.
     */
    rippleShouldTrigger(isTouch: boolean) {
        const shouldStart = isTouch ? true : !this.touchCache;
        this.touchCache = isTouch;
        return shouldStart;
    }

    /**
     * Start a ripple animation on an specific point with touch or mouse events. First
     * decides if the animation should trigger. If the ripple is multiple or there is no
     * ripple present, it creates a new key. If it's a simple ripple and already exists,
     * it just restarts the current ripple. The animation happens in two state changes
     * to allow triggering via css.
     *
     * @param x Coordinate X on the screen where animation should start
     * @param y Coordinate Y on the screen where animation should start
     * @param isTouch Use events from touch or mouse.
     */
    animateRipple(x: number, y: number, isTouch: boolean) {
        if (this.rippleShouldTrigger(isTouch)) {
            const {top, left, width} = this.getDescriptor(x, y);
            const noRipplesActive = Object.keys(this.state.ripples).length === 0;
            const key = this.props.rippleMultiple || noRipplesActive ? this.getNextKey() : this.getLastKey();
            const endRipple = this.addRippleDeactivateEventListener(isTouch, key);
            const initialState = {
                active: false,
                restarting: true,
                top,
                left,
                width,
                endRipple
            };
            const runningState = {active: true, restarting: false};

            this.setState(
                state => ({
                    ripples: {...state.ripples, [key]: initialState}
                }),
                () => {
                    if (this.rippleNodes[key]) {
                        // tslint:disable-next-line: no-unused-expression
                        this.rippleNodes[key].offsetWidth;
                    }

                    this.setState(state => ({
                        ripples: {
                            ...state.ripples,
                            [key]: {...state.ripples[key], ...runningState}
                        }
                    }));
                }
            );
        }
    }

    /**
     * Add an event listener to the reference with given key so when the animation transition
     * ends we can be sure that it finished and it can be safely removed from the state.
     * This function is called whenever a new ripple is added to the component.
     *
     * @param rippleKey Is the key of the ripple to add the event.
     */
    addRippleRemoveEventListener(rippleKey: string) {
        const self = this;
        const rippleNode = this.rippleNodes[rippleKey];
        rippleNode.addEventListener("transitionend", function onOpacityEnd(e: TransitionEvent) {
            if (e.propertyName === "opacity") {
                if (self.props.onRippleEnded) {
                    self.props.onRippleEnded(e);
                }
                self.rippleNodes[rippleKey].removeEventListener("transitionend", onOpacityEnd);
                delete self.rippleNodes[rippleKey];
                self.setState({ripples: omit(self.state.ripples, rippleKey)});
            }
        });
    }

    /**
     * Add an event listener to the document needed to deactivate a ripple and make it dissappear.
     * Deactivation can happen with a touchend or mouseup depending on the trigger type. The
     * ending function is created from a factory function and returned.
     *
     * @param  isTouch True in case the trigger was a touch event false otherwise.
     * @param rippleKey It's a key to identify the ripple that should be deactivated.
     */
    addRippleDeactivateEventListener(isTouch: boolean, rippleKey: string) {
        const eventType = isTouch ? "touchend" : "mouseup";
        const endRipple = this.createRippleDeactivateCallback(eventType, rippleKey);
        document.addEventListener(eventType, endRipple);
        return endRipple;
    }

    /**
     * Generates a function that can be called to deactivate a ripple and remove its finishing
     * event listener. If is generated because we need to store it to be called on unmount in case
     * the ripple is still running.
     *
     * @param eventType Is the event type that can be touchend or mouseup
     * @param rippleKey Is the key representing the ripple
     */
    createRippleDeactivateCallback(eventType: string, rippleKey: string) {
        const self = this;
        return function endRipple() {
            document.removeEventListener(eventType, endRipple);
            self.setState({
                ripples: {
                    ...self.state.ripples,
                    [rippleKey]: {...self.state.ripples[rippleKey], active: false}
                }
            });
        };
    }

    renderRipple(key: string, {active, left, restarting, top, width}: RippleEntry) {
        const {rippleTheme: theme} = this.props;
        const scale = restarting ? 0 : 1;
        const transform = `translate3d(${-width / 2 + left}px, ${-width / 2 + top}px, 0) scale(${scale})`;
        return (
            <span key={key} data-react-toolbox="ripple" className={theme.rippleWrapper()}>
                <span
                    className={theme.ripple({active, restarting})}
                    ref={node => {
                        if (node) {
                            this.rippleNodes[key] = node;
                        }
                    }}
                    style={{transform, width, height: width}}
                />
            </span>
        );
    }

    render() {
        const {
            children,
            disabled,
            onRippleEnded,
            ripple,
            rippleCentered,
            rippleMultiple,
            ripplePassthrough,
            rippleSpread,
            rippleTheme: theme,
            ComposedComponent,
            ...other
        } = this.props;
        const {ripples} = this.state;
        const childRipples = Object.keys(ripples).map(key => this.renderRipple(key, ripples[key]));
        const childProps = {
            ...other,
            onMouseDown: this.handleMouseDown,
            onTouchStart: this.handleTouchStart
        };
        const finalProps = ripplePassthrough ? {...childProps, disabled} : childProps;
        return (
            <ComposedComponent {...(finalProps as any)}>
                {children}
                {ripple ? childRipples : null}
            </ComposedComponent>
        );
    }
}
