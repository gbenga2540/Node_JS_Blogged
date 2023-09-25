const none_null = require('./None_Null_Checker');

module.exports = (pagination_index, max_results) => {
    const processed_pagination_index = none_null(pagination_index)
        ? 0
        : parseInt(pagination_index);
    const processed_max_result = none_null(max_results)
        ? 20
        : parseInt(max_results);

    const first_index =
        processed_pagination_index <= 0
            ? 0
            : processed_pagination_index * processed_max_result;

    return {
        first_index,
        last_index: processed_max_result,
    };
};
