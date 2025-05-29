import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import stylów domyślnych React Datepicker
import "../styles/CalendarComponent.css"; // Import niestandardowych stylów


const CalendarComponent: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    return (
        <div className="calendar-container">
        
            <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => setSelectedDate(date)}
                dateFormat="yyyy-MM-dd"
                className="custom-datepicker"
                placeholderText="Wybierz datę"
            />
        </div>
    );
};

export default CalendarComponent;