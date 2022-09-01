module.exports = (check) => {

    if (check === "[]") {
        return "[]";
    } else {
        if (check?.length > 3) {
            const checked_var = check[check?.length - 2];
            if (checked_var === ",") {
                const new_check = check.slice(0, check?.length - 2) + check.slice(check?.length - 1);
                return new_check;
            } else {
                return check;
            }
        } else {
            return check;
        }
    }
}