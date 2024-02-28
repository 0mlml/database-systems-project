const formOnSubmit = e => {
    e.preventDefault();

    const data = {};
    const inputs = e.target.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="number"], input[type="hidden"]');

    inputs.forEach(input => {
        data[input.id] = input.value;
    });

    const endpoint = e.target.getAttribute('endpoint');

    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(resp => resp.json())
        .then(dec => console.log(dec))
        .catch(err => {
            console.error('Error:', err);
        });
}

document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', formOnSubmit);
});
