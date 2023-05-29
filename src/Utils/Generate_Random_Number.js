module.exports = count_length => {
    const processed_count = parseInt(count_length);
    if (processed_count > 0) {
        let random_number = '';
        for (let i = 0; i < processed_count; i++) {
            const number = parseInt(Math.random() * 8) + 1;
            const stringified_number = number.toString();
            random_number = random_number.concat(stringified_number);
        }
        return random_number;
    } else {
        let random_number = '';
        for (let i = 0; i < 6; i++) {
            const number = parseInt(Math.random() * 8) + 1;
            const stringified_number = number.toString();
            random_number = random_number.concat(stringified_number);
        }
        return random_number;
    }
};
