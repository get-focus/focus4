import {useCallback, useMemo} from "react";

import {ToBem} from "@focus4/styling";
import {CalendarCss} from "../__style__/calendar.css";

export interface DayProps {
    day: number;
    disabled: boolean;
    onClick: (day: number) => void;
    selectedDate: Date;
    sundayFirstDayOfWeek: boolean;
    theme: ToBem<CalendarCss>;
    viewDate: Date;
}

export function Day({day, disabled, onClick, selectedDate, sundayFirstDayOfWeek, theme, viewDate}: DayProps) {
    const handleClick = useCallback(() => {
        if (!disabled && onClick) {
            onClick(day);
        }
    }, [day, disabled, onClick]);

    const dayStyle = useMemo(() => {
        if (day === 1) {
            const e = sundayFirstDayOfWeek ? 0 : 1;
            const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() - e;
            return {
                marginLeft: `${(firstDay >= 0 ? firstDay : 6) * (100 / 7)}%`
            };
        }
        return undefined;
    }, [day, sundayFirstDayOfWeek, viewDate]);

    const active = useMemo(() => {
        const sameYear = viewDate.getFullYear() === selectedDate.getFullYear();
        const sameMonth = viewDate.getMonth() === selectedDate.getMonth();
        const sameDay = day === selectedDate.getDate();
        return sameYear && sameMonth && sameDay;
    }, [day, selectedDate, viewDate]);

    return (
        <div data-react-toolbox="day" className={theme.day({active, disabled})} style={dayStyle}>
            <span onClick={handleClick}>{day}</span>
        </div>
    );
}
