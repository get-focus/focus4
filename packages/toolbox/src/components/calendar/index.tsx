import range from "ramda/src/range";
import {MouseEvent, useCallback, useEffect, useMemo, useRef, useState} from "react";
import rtDatePickerTheme from "react-toolbox/components/date_picker/theme.css";
import {DatePickerLocale, DatePickerTheme} from "react-toolbox/lib/date_picker";
import {DATE_PICKER} from "react-toolbox/lib/identifiers";
import time from "react-toolbox/lib/utils/time";
import {CSSTransition, TransitionGroup} from "react-transition-group";

import {CSSProp, cssTransitionProps, fromBem, useTheme} from "@focus4/styling";
const datePickerTheme: DatePickerTheme = rtDatePickerTheme;
export {datePickerTheme, DatePickerTheme};

import {IconButton} from "../icon-button";
import {Month} from "./month";

export interface CalendarProps {
    disabledDates?: Date[];
    display?: "months" | "years";
    enabledDates?: Date[];
    handleSelect?: () => void;
    locale?: string | DatePickerLocale;
    maxDate?: Date;
    minDate?: Date;
    onChange: (date: Date, dayClick: boolean) => void;
    selectedDate?: Date;
    sundayFirstDayOfWeek?: boolean;
    theme?: CSSProp<DatePickerTheme>;
}

export function Calendar({
    disabledDates,
    display = "months",
    enabledDates,
    handleSelect,
    locale,
    onChange,
    maxDate,
    minDate,
    selectedDate = new Date(),
    sundayFirstDayOfWeek = false,
    theme: pTheme
}: CalendarProps) {
    const theme = useTheme(DATE_PICKER, datePickerTheme, pTheme);
    const yearsNode = useRef<HTMLUListElement | null>(null);
    const activeYearNode = useRef<HTMLLIElement | null>(null);

    const [pending, setPending] = useState<{days?: number; months?: number}>({});
    const [animation, setAnimation] = useState({enter: "", enterActive: "", exit: "", exitActive: ""});
    const [viewDate, setViewDate] = useState(selectedDate);

    const setAnimationLeft = useCallback(() => {
        const css = fromBem(theme) as any;
        setAnimation({
            enter: css.slideLeftEnter,
            enterActive: css.slideLeftEnterActive,
            exit: css.slideLeftLeave,
            exitActive: css.slideLeftLeaveActive
        });
    }, [theme]);

    const setAnimationRight = useCallback(() => {
        const css = fromBem(theme) as any;
        setAnimation({
            enter: css.slideRightEnter,
            enterActive: css.slideRightEnterActive,
            exit: css.slideRightLeave,
            exitActive: css.slideRightLeaveActive
        });
    }, [theme]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const handleDayArrowKey = (days: number) => {
                setPending({days});
                onChange(time.addDays(selectedDate, days), false);
            };

            switch (e.key) {
                case "Enter":
                    e.preventDefault();
                    handleSelect?.();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    handleDayArrowKey(-1);
                    setAnimationLeft();
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    handleDayArrowKey(-7);
                    setAnimationLeft();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    handleDayArrowKey(+1);
                    setAnimationRight();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    handleDayArrowKey(+7);
                    setAnimationRight();
                    break;
                default:
                    break;
            }
        };

        document.addEventListener("keydown", handleKeys);
        return () => document.removeEventListener("keydown", handleKeys);
    }, [handleSelect, onChange, selectedDate, setAnimationLeft, setAnimationRight]);

    useEffect(() => {
        if (activeYearNode.current && yearsNode.current) {
            const offset = yearsNode.current.offsetHeight / 2 + activeYearNode.current.offsetHeight / 2;
            yearsNode.current.scrollTop = activeYearNode.current.offsetTop - offset;
        }
    });

    const handleDayClick = useCallback(
        (day: number) => {
            onChange(time.setDay(viewDate, day), true);
        },
        [onChange, viewDate]
    );

    const handleYearClick = useCallback(
        (event: MouseEvent<HTMLLIElement>) => {
            const year = parseInt(event.currentTarget.id, 10);
            const vDate = time.setYear(selectedDate, year);
            setViewDate(vDate);
            onChange(vDate, false);
        },
        [onChange, selectedDate]
    );

    const years = useMemo(
        () => (
            <ul data-react-toolbox="years" className={theme.years()} ref={yearsNode}>
                {range(1900, 2100).map(year => (
                    <li
                        className={year === viewDate.getFullYear() ? theme.active() : ""}
                        id={`${year}`}
                        key={year}
                        onClick={handleYearClick}
                        ref={node => {
                            if (year === viewDate.getFullYear()) {
                                activeYearNode.current = node;
                            }
                        }}
                    >
                        {year}
                    </li>
                ))}
            </ul>
        ),
        [handleYearClick, theme, viewDate]
    );

    useEffect(() => {
        if (pending.days) {
            setViewDate(time.addDays(selectedDate, pending.days));
            setPending({});
        } else if (pending.months) {
            setViewDate(time.addMonths(viewDate, pending.months));
            setPending({});
        }
    }, [pending]);

    const months = useMemo(
        () => (
            <div data-react-toolbox="calendar">
                <IconButton
                    className={theme.prev()}
                    icon="chevron_left"
                    onClick={() => {
                        setAnimationLeft();
                        setPending({months: -1});
                    }}
                />
                <IconButton
                    className={theme.next()}
                    icon="chevron_right"
                    onClick={() => {
                        setAnimationRight();
                        setPending({months: +1});
                    }}
                />
                <TransitionGroup component={null}>
                    <CSSTransition key={viewDate.getMonth()} {...cssTransitionProps(animation)}>
                        <Month
                            disabledDates={disabledDates}
                            enabledDates={enabledDates}
                            locale={locale}
                            maxDate={maxDate}
                            minDate={minDate}
                            onDayClick={handleDayClick}
                            selectedDate={selectedDate}
                            sundayFirstDayOfWeek={sundayFirstDayOfWeek}
                            theme={theme}
                            viewDate={viewDate}
                        />
                    </CSSTransition>
                </TransitionGroup>
            </div>
        ),
        [
            disabledDates,
            enabledDates,
            locale,
            handleDayClick,
            maxDate,
            minDate,
            selectedDate,
            setAnimationLeft,
            setAnimationRight,
            sundayFirstDayOfWeek,
            theme,
            viewDate
        ]
    );

    return <div className={theme.calendar()}>{display === "months" ? months : years}</div>;
}