import {uniqueId} from "lodash";
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import moment from "moment-timezone";
import {Component, KeyboardEvent} from "react";

import {CSSProp, themr} from "@focus4/styling";
import {Calendar, CalendarProps, IconButton} from "@focus4/toolbox";

import {Input, InputProps} from "./input";

import inputDateCss, {InputDateCss} from "./__style__/input-date.css";
export {inputDateCss};

const Theme = themr("inputDate", inputDateCss);

export interface InputDateProps {
    /** Format de l'affichage de la date dans le calendrier. */
    calendarFormat?: string;
    /* Autres props du Calendar RT */
    calendarProps?: Omit<CalendarProps, "display" | "handleSelect" | "onChange" | "selectedDate">;
    /** Composant affiché depuis la gauche ou la droite. */
    displayFrom?: "left" | "right";
    /** Format de la date dans l'input. */
    inputFormat?: string;
    /** Props de l'input. */
    inputProps?: Omit<InputProps<"string">, "mask" | "onChange" | "onKeyDown" | "onFocus" | "type" | "value">;
    /**
     * Définit la correspondance entre une date et l'ISOString (date/heure) associé.
     *
     * Par exemple, pour 24/10/2017 en UTC + 2
     *
     * "utc-midnight" : Minuit, en UTC. (-> 2017-10-24T00:00:00Z)
     *
     * "local-midnight" : Minuit, au fuseau horaire local. (-> 2017-10-24T00:00:00+02:00)
     *
     * "local-utc-midnight" : Minuit à l'heure locale, en UTC. (-> 2017-10-23T22:00:00Z)
     *
     * En "utc-midnight", le composant ignore totalement la composante heure de la date qu'il reçoit,
     * alors qu'en "local-*" la date sera convertie dans le fuseau horaire local. Quelque soit le format choisi,
     * la composante heure sera toujours normalisée (comme choisi) en sortie de `onChange`.
     *
     * Par défaut "utc-midnight".
     */
    ISOStringFormat?: "utc-midnight" | "local-midnight" | "local-utc-midnight";
    /** Appelé lorsque la date change. */
    onChange: (date: string | undefined) => void;
    /**
     * Code Timezone que l'on souhaite appliquer au DatePicker dans le cas d'une Timezone différente de celle du navigateur (https://momentjs.com/timezone/)
     * Incompatible avec l'usage de ISOStringFormat
     */
    timezoneCode?: string;
    /** CSS. */
    theme?: CSSProp<InputDateCss>;
    /** Valeur. */
    value: string | undefined;
}

/** Composant d'input avec un calendrier (React-Toolbox). Diffère du DatePicker classique car il n'est pas affiché en plein écran et autorise la saisie manuelle. */
@observer
export class InputDate extends Component<InputDateProps> {
    protected calendar?: HTMLDivElement | null;

    /** Id unique de l'input date, pour gérer la fermeture en cliquant à l'extérieur. */
    protected readonly _inputDateId = uniqueId("input-date-");

    /** Date actuelle. */
    @observable protected date = this.toMoment(this.props.value);

    /** Contenu du champ texte. */
    @observable protected dateText = this.formatDate(this.props.value);

    /** Affiche le calendrier. */
    @observable protected showCalendar = false;

    /** Mode du calendrier. */
    @observable protected calendarDisplay = "months" as "months" | "years";

    /** Position du calendrier. */
    @observable protected calendarPosition?: "up" | "down";

    UNSAFE_componentWillMount() {
        document.addEventListener("mousedown", this.onDocumentClick);
    }

    @action
    UNSAFE_componentWillReceiveProps({value}: InputDateProps) {
        this.date = this.toMoment(value);
        this.dateText = this.formatDate(value);
    }

    // Met à jour la position du calendrier.
    componentDidUpdate() {
        if (this.calendar && this.showCalendar) {
            const client = this.calendar.getBoundingClientRect();
            const screenHeight = window.innerHeight || document.documentElement!.offsetHeight;
            if (!this.calendarPosition) {
                if (client.top + client.height > screenHeight) {
                    this.calendarPosition = "up";
                } else {
                    this.calendarPosition = "down";
                }
            }
        } else {
            this.calendarPosition = undefined;
        }
    }

    componentWillUnmount() {
        document.removeEventListener("mousedown", this.onDocumentClick);
    }

    @computed
    get jsDate() {
        const {timezoneCode} = this.props;
        // Vérifie que la timezone existe
        if (timezoneCode && moment.tz.zone(timezoneCode)) {
            return getPickerDate(this.date.toDate(), timezoneCode);
        }
        const {ISOStringFormat = "utc-midnight"} = this.props;
        if (ISOStringFormat === "utc-midnight") {
            return new Date(this.date.year(), this.date.month(), this.date.date());
        } else {
            const jsDate = this.date.toDate();
            jsDate.setHours(0);
            jsDate.setMinutes(0);
            jsDate.setSeconds(0);
            jsDate.setMilliseconds(0);
            return jsDate;
        }
    }

    /** Convertit le texte en objet MomentJS. */
    toMoment(value?: string) {
        const {ISOStringFormat = "utc-midnight", timezoneCode} = this.props;
        const m = ISOStringFormat === "utc-midnight" ? moment.utc : moment;

        if (isISOString(value)) {
            if (timezoneCode && moment.tz.zone(timezoneCode)) {
                return moment(value, moment.ISO_8601).tz(timezoneCode);
            }
            return m(value, moment.ISO_8601);
        } else {
            return m().hour(0).minute(0).second(0).millisecond(0);
        }
    }

    /** Formatte la date (ISO String) en entrée selon le format demandé. */
    formatDate(value?: string) {
        const {inputFormat = "MM/DD/YYYY", timezoneCode} = this.props;
        if (isISOString(value)) {
            if (timezoneCode && moment.tz.zone(timezoneCode)) {
                return moment(value, moment.ISO_8601).tz(timezoneCode).format(inputFormat);
            }
            // Le format d'ISO String n'importe peu, ça revient au même une fois formatté.
            return moment(value, moment.ISO_8601).format(inputFormat);
        } else {
            return value;
        }
    }

    /** Ferme le calendrier lorsqu'on clic à l'extérieur du picker. */
    @action.bound
    onDocumentClick({target}: Event) {
        let parent = target as HTMLElement | null;

        while (parent && parent.getAttribute("data-id") !== this._inputDateId) {
            parent = parent.parentElement;
        }

        if (this.showCalendar && !parent) {
            this.showCalendar = false;
            this.onInputBlur();
        }
    }

    /** Appelé lorsqu'on quitte le champ texte. */
    @action.bound
    onInputBlur() {
        const {inputFormat = "MM/DD/YYYY", onChange} = this.props;
        const text = (this.dateText || "").trim() || undefined;

        const date = this.transformDate(text, inputFormat, true);

        if (date.isValid()) {
            this.date = date;
            onChange(date.format());
        } else {
            onChange(text);
        }
    }

    /** Au clic sur le calendrier. */
    @action.bound
    onCalendarChange(date: Date, dayClick: boolean) {
        const {ISOStringFormat = "utc-midnight", timezoneCode} = this.props;
        // Vérifie que la timezone existe
        if (timezoneCode && moment.tz.zone(timezoneCode)) {
            date = getTimezoneTime(date, timezoneCode);
        } else {
            // La date reçue est toujours à minuit en "local-midnight".
            if (ISOStringFormat === "utc-midnight") {
                // Dans ce cas, on modifie l'heure pour se mettre à minuit UTC en local.
                date.setHours(date.getHours() - date.getTimezoneOffset() / 60);
            }
        }
        const correctedDate = this.transformDate(date).format();
        this.props.onChange(correctedDate);
        if (!dayClick) {
            this.calendarDisplay = "months";
        } else {
            this.showCalendar = false;
        }
    }

    /** Ferme le calendrier lorsqu'on appuie sur Entrée ou Tab. */
    @action.bound
    handleKeyDown({key}: KeyboardEvent) {
        if (key === "Tab" || key === "Enter") {
            this.showCalendar = false;
            this.onInputBlur();
        }
    }

    /** Transforme la date selon le format de date/timezone souhaité. */
    transformDate(date: Date): moment.Moment; // Depuis le calendrier.
    transformDate(date: string | undefined, inputFormat: string, strict: true): moment.Moment; // Depuis la saisie manuelle.
    transformDate(...params: any[]) {
        const {ISOStringFormat = "utc-midnight"} = this.props;

        // Dans les deux cas, la date d'entrée est bien en "local-midnight".
        if (ISOStringFormat === "local-midnight") {
            return moment(...params);
        } else if (ISOStringFormat === "utc-midnight") {
            return moment.utc(...params);
        } else {
            return moment(...params).utcOffset(0);
        }
    }

    displayedDate() {
        const {timezoneCode, ISOStringFormat} = this.props;
        if (timezoneCode && moment.tz.zone(timezoneCode)) {
            return this.date.tz(timezoneCode);
        } else {
            if (ISOStringFormat === "local-utc-midnight") {
                return this.date.clone().local();
            }
            return this.date;
        }
    }

    render() {
        const {
            theme: pTheme,
            inputFormat = "MM/DD/YYYY",
            calendarFormat = "ddd, MMM D",
            displayFrom = "left",
            calendarProps = {},
            inputProps = {}
        } = this.props;
        return (
            <Theme theme={pTheme}>
                {theme => (
                    <div data-focus="input-date" data-id={this._inputDateId} className={theme.input()}>
                        <Input
                            {...inputProps}
                            {...{autoComplete: "off"}}
                            mask={{pattern: inputFormat.replace(/\w/g, "1")}}
                            onChange={value => (this.dateText = value)}
                            onKeyDown={this.handleKeyDown}
                            onFocus={() => (this.showCalendar = true)}
                            type="string"
                            value={this.dateText || ""}
                        />
                        {this.showCalendar ? (
                            <div
                                ref={cal => (this.calendar = cal)}
                                className={theme.calendar({
                                    [this.calendarPosition ?? "down"]: true,
                                    fromRight: displayFrom == "right"
                                })}
                            >
                                <header className={theme.header({[this.calendarDisplay]: true})}>
                                    <span
                                        id="years"
                                        className={theme.year()}
                                        onClick={() => (this.calendarDisplay = "years")}
                                    >
                                        {this.displayedDate().year()}
                                    </span>
                                    <h3
                                        id="months"
                                        className={theme.date()}
                                        onClick={() => (this.calendarDisplay = "months")}
                                    >
                                        {this.displayedDate().format(calendarFormat)}
                                    </h3>
                                    <IconButton
                                        icon="clear"
                                        theme={{toggle: theme.toggle()}}
                                        onClick={() => (this.showCalendar = false)}
                                    />
                                </header>
                                <div className={theme.calendarWrapper()}>
                                    <Calendar
                                        {...calendarProps}
                                        display={this.calendarDisplay}
                                        handleSelect={() => null}
                                        onChange={this.onCalendarChange}
                                        selectedDate={this.jsDate}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </Theme>
        );
    }
}

/** Détermine si une valeur est un ISO String. */
function isISOString(value?: string) {
    return moment(value, moment.ISO_8601, true).isValid();
}

/** Détermine la date pour le picker en prenant en compte la timezone */
function getPickerDate(tzDate: Date, timezoneCode: string) {
    const tzUTCOffset = moment.tz(tzDate, timezoneCode).utcOffset();
    const utcDate = new Date();
    utcDate.setTime(tzDate.getTime() + tzUTCOffset * 60000);

    const pickerDate = new Date();
    const pickerOffset = pickerDate.getTimezoneOffset();
    pickerDate.setTime(utcDate.getTime() + pickerOffset * 60000);

    return pickerDate;
}

/** Détermine la date pour retourné en prenant en compte la timezone */
function getTimezoneTime(pickerDate: Date, timezoneCode: string) {
    const pickerOffset = pickerDate.getTimezoneOffset();
    const utcDate = new Date();
    utcDate.setTime(pickerDate.getTime() - pickerOffset * 60000);

    const tzOffset = moment.tz(pickerDate, timezoneCode).utcOffset();
    const tzDate = new Date();
    tzDate.setTime(utcDate.getTime() - tzOffset * 60000);
    return tzDate;
}
