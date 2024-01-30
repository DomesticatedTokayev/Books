function formatDate(date) {
    if (date !== null)
    {
        return date.toLocaleString(`en-CA`, {day: `2-digit` , month: `2-digit`,  year: `numeric`});
    }
    return null;
}

export default formatDate;