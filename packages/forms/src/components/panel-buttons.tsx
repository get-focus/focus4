import i18next from "i18next";
import * as React from "react";

import {getIcon} from "@focus4/styling";
import {Button} from "@focus4/toolbox";

/** Props des boutons du Panel. */
export interface PanelButtonsProps {
    /** Etat d'édition. */
    editing?: boolean;
    /** Préfixe i18n. Par défaut : "focus" */
    i18nPrefix?: string;
    /** En cours de chargement */
    loading?: boolean;
    /** Appelé au clic sur le bouton "Annuler". */
    onClickCancel?: () => void;
    /** Appelé au clic sur le bouton "Modifier". */
    onClickEdit?: () => void;
    /** Handler du bouton save. */
    save?: () => void;
}

/** Buttons par défaut du panel : edit / save / cancel. */
export function PanelButtons({
    editing,
    i18nPrefix = "focus",
    loading,
    onClickCancel,
    onClickEdit,
    save
}: PanelButtonsProps) {
    const [isInForm, setIsInForm] = React.useState(false);
    const [ref, setRef] = React.useState<HTMLSpanElement | null>(null);

    /* On essaie de savoir si ces boutons sont inclus dans un formulaire. */
    React.useEffect(() => {
        let parentNode: HTMLElement | null = ref;
        while (parentNode && parentNode.tagName !== "FORM") {
            parentNode = parentNode.parentElement;
        }
        setIsInForm(!!parentNode);
    }, [ref]);

    if (onClickCancel && onClickEdit) {
        if (editing) {
            return (
                <span ref={setRef}>
                    <Button
                        icon={getIcon(`${i18nPrefix}.icons.button.save`)}
                        label={i18next.t(`${i18nPrefix}.button.save`)}
                        primary={true}
                        onClick={!isInForm ? save : undefined}
                        type="submit"
                        disabled={loading}
                    />
                    <Button
                        icon={getIcon(`${i18nPrefix}.icons.button.cancel`)}
                        label={i18next.t(`${i18nPrefix}.button.cancel`)}
                        onClick={onClickCancel}
                        disabled={loading}
                    />
                </span>
            );
        } else {
            return (
                <Button
                    icon={getIcon(`${i18nPrefix}.icons.button.edit`)}
                    label={i18next.t(`${i18nPrefix}.button.edit`)}
                    onClick={onClickEdit}
                />
            );
        }
    } else {
        return null;
    }
}
