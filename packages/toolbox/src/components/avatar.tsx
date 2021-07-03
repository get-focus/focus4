import classNames from "classnames";
import {ReactNode} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import avatarCss, {AvatarCss} from "./__style__/avatar.css";
export {avatarCss, AvatarCss};

import {FontIcon} from "./font-icon";

export interface AvatarProps {
    /** Alt text for the image. */
    alt?: string;
    className?: string;
    /** Children to pass through the component. */
    children?: ReactNode;
    /** Set to true if your image is not squared so it will be used as a cover for the element. */
    cover?: boolean;
    /** A key to identify an Icon from Material Design Icons or a custom Icon Element. */
    icon?: ReactNode;
    /**  An image source or an image element. */
    image?: ReactNode;
    /** Classnames object defining the component style. */
    theme?: CSSProp<AvatarCss>;
    /** A title for the image. If no image is provided, the first letter will be displayed as the avatar. */
    title?: string;
}

export function Avatar({alt = "", className, children, cover = false, icon, image, title, theme: pTheme}: AvatarProps) {
    const theme = useTheme("RTAvatar", avatarCss, pTheme);
    return (
        <div data-react-toolbox="avatar" className={classNames(theme.avatar(), className)}>
            {children}
            {cover && typeof image === "string" && (
                <span aria-label={alt} className={theme.image()} style={{backgroundImage: `url(${image})`}} />
            )}
            {!cover &&
                (typeof image === "string" ? (
                    <img alt={alt} className={theme.image()} src={image} title={title} />
                ) : (
                    image
                ))}
            {typeof icon === "string" ? <FontIcon className={theme.letter()} value={icon} alt={alt} /> : icon}
            {title ? <span className={theme.letter()}>{title[0]}</span> : null}
        </div>
    );
}
