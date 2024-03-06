/*
 Helpers
*/

/**
 * Executes a query by sending it to the server and updating the result field.
 * @param {string} query - The query to be executed.
 */
function executeQuery(query) {
    fetch('/submitQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    })
        .then(response => response.text())
        .then(text => document.getElementById('result').value = text)
        .catch(err => console.error('Error:', err));
}

/**
 * Checks if a table exists in the database.
 * @param {string} tableName - The name of the table to check.
 * @returns {Promise<boolean>} - A promise that resolves to true if the table exists, false otherwise.
 */
function checkTableExists(tableName) {
    return fetch('/checkTableExists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName })
    })
        .then(response => response.text())
        .then(text => text === 'true' ? true : false)
        .catch(err => console.error('Error:', err));
}

/**
 * Wraps the input value in single quotes if it is not a numeric value.
 * @param {any} s - The input value to be wrapped.
 * @returns {string} - The wrapped value.
 */
function wrapIfNotNumeric(s) {
    return isNaN(s) ? `'${s}'` : s;
}

/*
 Event listeners
*/

let insertQueryTableHandlerTimeout = null;
document.getElementById('insertQueryTableName').addEventListener('keypress', function (e) {
    clearTimeout(insertQueryTableHandlerTimeout);
    insertQueryTableHandlerTimeout = setTimeout(function () {
        checkIfTableExists(e);

        const tableName = e.target.value;

        fetch('/fetchTableHeaders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableName })
        })
            .then(response => {
                if (response.status !== 200) {
                    console.error('Error:', response.status);
                    const tableGrid = document.getElementById('insertQueryTable');
                    tableGrid.innerHTML = '';
                    return;
                }
                return response.text();
            })
            .then(text => {
                if (!text) return;
                const tableGrid = document.getElementById('insertQueryTable');
                tableGrid.innerHTML = '';
                tableGrid.className = 'table-grid';

                const headers = text.split(',');
                headers.forEach(header => {
                    const divContainer = document.createElement('div');
                    divContainer.className = 'grid-item';

                    const headerText = document.createElement('div');
                    headerText.textContent = header.trim();
                    headerText.className = 'table-header';
                    divContainer.appendChild(headerText);


                    const hr = document.createElement('hr');
                    divContainer.appendChild(hr);

                    const inputField = document.createElement('input');
                    inputField.type = 'text';
                    inputField.name = header.trim();
                    inputField.className = 'table-input';
                    divContainer.appendChild(inputField);


                    tableGrid.appendChild(divContainer);
                });
            })
            .catch(err => console.error('Error:', err));
    }, 200);
});

/**
 * Checks if a table exists and updates the class of the target element accordingly.
 * @param {Event} e - The event object.
 */
function checkIfTableExists(e) {
    const tableName = e.target.value;

    checkTableExists(tableName).then(exists => {
        if (exists) {
            e.target.classList.add('is-valid');
            e.target.classList.remove('is-invalid');
        } else {
            e.target.classList.add('is-invalid');
            e.target.classList.remove('is-valid');
        }
    }).catch(error => {
        console.error(error);
    });
}

let deleteQueryTableExistsTimeout = null;
document.getElementById('deleteQueryTableName').addEventListener('keypress', function (e) {
    clearTimeout(deleteQueryTableExistsTimeout);

    deleteQueryTableExistsTimeout = setTimeout(checkIfTableExists(e), 200);
});

document.getElementById('deleteQuerySubmit').addEventListener('click', function () {
    executeQuery(`DELETE FROM ${document.getElementById('deleteQueryTableName').value} WHERE ${document.getElementById('deleteQueryCondition').value}`);
});

document.getElementById('insertQuerySubmit').addEventListener('click', function () {
    const tableName = document.getElementById('insertQueryTableName').value;
    const values = Array.from(document.querySelectorAll('.table-input'))
        .map(input => wrapIfNotNumeric(input.value))
        .join(', ');

    const query = `INSERT INTO ${tableName} VALUES (${values})`;
    executeQuery(query);
});

document.getElementById('checkIndexSubmit').addEventListener('click', function () {
    executeQuery(`DO $$
DECLARE
    index_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'patient'
        AND indexname = 'patient_name'
    ) INTO index_exists;

    IF index_exists THEN
        RAISE NOTICE 'Index exists!';
    ELSE
        RAISE NOTICE 'Index does not exist!';
    END IF;
END $$;`);
});