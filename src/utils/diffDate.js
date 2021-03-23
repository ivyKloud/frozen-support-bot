const diffDate = (date1, date2) => {

    // The number of milliseconds in one day
    const ONE_DAY = 1000 * 60 * 60 * 24;

    // Calculate the difference in milliseconds
    const differenceMs = Math.abs(date1 - date2);

    // Convert back to days and return
    return Math.ceil(differenceMs / ONE_DAY);

}

module.exports = diffDate