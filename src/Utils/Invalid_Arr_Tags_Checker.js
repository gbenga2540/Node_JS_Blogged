module.exports = check => {
    try {
        if (check === '[]') {
            return [];
        } else {
            if (check?.length > 3) {
                const checked_var = check[check?.length - 2];
                if (checked_var === ',') {
                    const new_check =
                        check.slice(0, check?.length - 2) +
                        check.slice(check?.length - 1);
                    return JSON.parse(new_check);
                } else {
                    return JSON.parse(check);
                }
            } else {
                return JSON.parse(check);
            }
        }
    } catch (error) {
        return [];
    }
};
