const kinveyBaseUrl = "https://baas.kinvey.com/";
const kinveyAppKey = "kid_ryLiXQQY";
const kinveyAppSecret = "8311610a15744a12a147d98a441baac4";

function showView(viewName) {
    $('main > section').hide();
    $('#' + viewName).show();
}

function showHideMenuLinks() {
    $("#linkHome").show();
    if (sessionStorage.getItem('authToken') == null) {
        $("#linkLogin").show();
        $("#linkRegister").show();
        $("#linkListCheat").show();//!!!!
        $("#linkAddCheat").hide();
        $("#linkProfile").hide();
        $("#linkLogout").hide();
    }
    else {
        $("#linkLogin").hide();
        $("#linkRegister").hide();
        $("#linkListCheat").show();
        $("#linkAddCheat").show();
        $("#linkProfile").show();
        $("#linkLogout").show();
    }
}

function showInfo(message) {
    $('#infoBox').text(message);
    $('#infoBox').show();
    setTimeout(function () {
        $('#infoBox').fadeOut()
    }, 3000)
}

function showError(errorMsg) {
    $('#errorBox').text("Error: " + errorMsg);
    $('#errorBox').show();
}

$(function () {
    showHideMenuLinks();
    showView('viewHome');

    $("#linkHome").click(showHomeView);
    $("#linkLogin").click(showLoginView);
    $("#linkRegister").click(showRegisterView);
    $("#linkListCheat").click(listCheats);
    $("#linkAddCheat").click(showAddCheatView);
    $("#linkProfile").click(showProfile);
    $("#linkLogout").click(logout);

    $("#formLogin").submit(function (e) {
        e.preventDefault();
        login();
    });

    $("#formRegister").submit(function (e) {
        e.preventDefault();
        register();
    });

    $("#formAddCheats").submit(function (e) {
        e.preventDefault();
        createCheat();
    });

    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });
});

function showHomeView() {
    showView('viewHome')
}

function showLoginView() {
    showView('viewLogin')
}

function login() {
    const kinveyLoginUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/login";
    const kinveyAuthHeaders = {
        'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    let userData = {
        username: $('#loginUser').val(),
        password: $('#loginPass').val()
    };

    $.ajax({
        method: "POST",
        url: kinveyLoginUrl,
        headers: kinveyAuthHeaders,
        data: userData,
        success: loginSuccess,
        error: handleAjaxError
    });

    function loginSuccess(response) {
        let userAuth = response._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        showHideMenuLinks();
        listCheats();
        showInfo('Login successful.')
    }
}

function handleAjaxError(response) {
    let errorMsg = JSON.stringify(response);
    if (response.readyState === 0) {
        errorMsg = "Cannon connect due to network error.";
    }

    if (response.responseJSON && response.responseJSON.description) {
        errorMsg = response.responseJSON.description;
    }

    showError(errorMsg);
}

function showRegisterView() {
    showView('viewRegister')
}

function register() {
    const kinveyRegisterUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/";
    const kinveyAuthHeaders = {
        'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    let userData = {
        username: $('#registerUser').val(),
        password: $('#registerPass').val(),
        passwordConf: $('#registerPassConf').val()
    };

    if (userData.username.length < 4) {
        handleAjaxError('Username length must be more than 4 characters');
    }
    else if (userData.password.length < 6) {
        handleAjaxError('Password length must be more than 6 characters');
    }
    else if (userData.password != userData.passwordConf) {
        handleAjaxError('Passwords do not match');
    }

    else {
        delete userData['passwordConf'];
        $.ajax({
            method: "POST",
            url: kinveyRegisterUrl,
            headers: kinveyAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(response) {
            // let userAuth = response._kmd.authtoken;
            // sessionStorage.setItem('authToken', userAuth);
            showHideMenuLinks();
            listCheats();
            showInfo('User registration successful.')
        }
    }
}

function listCheats() {
    $('#cheats').empty();
    showView('viewCheats');

    const kinveyCheatsUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/cheats";
    const kinveyAuthHeaders = {
        //'Authorization': "Kinvey " + sessionStorage.getItem('authToken')
        'Authorization': "Basic " + btoa("guest1:guest1")
    };

    $.ajax({
        method: "GET",
        url: kinveyCheatsUrl,
        headers: kinveyAuthHeaders,
        success: loadCheatsSuccess,
        error: handleAjaxError
    });
}

function loadCheatsSuccess(cheats) {
    showInfo('Cheats loaded.');
    let info = $('<h5 class="textInfo">').text("Cheats");
    let arr = [];
    if (cheats.length == 0) {
        $('#cheats').text('No cheats in the library')
    }
    else {
        let cheatsTable = $('<table class="tableFormat">')
            .append($('<tr>').append(
                '<th>Game</th>',
                '<th>Cheat</th>',
                '<th>Description</th>',
                '<th>Tags</th>',
                '<th>User</th>'
            ));

        for (let cheat of cheats) {
            arr.push(cheat.game);
        }

        var unique = arr.filter(onlyUnique);

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        let result = unique.sort();
        for (i = 0; i < result.length; i++) {
            for (let cheat of cheats) {
                if (result[i] == cheat.game) {
                    cheatsTable.append($('<tr>').append(
                        $('<td>').text(cheat.game),
                        $('<td>').text(cheat.cheat),
                        $('<td>').text(cheat.description),
                        $('<td>').text(cheat.tags),
                        $('<td>').text(cheat.user)
                    ));
                }
            }
        }

        $('#cheats').append(info).append(cheatsTable).append($('<button id="showMore" class="inputButton">').text('Show more'));
        $('table').find('tr:gt(5)').hide();


        $("#showMore").on("click", function () {
            $('table').find('tr:gt(0)').show();
            $("#showMore").hide();
        });
    }
}

function listUserCheats() {
    $('#cheats').empty();
    showView('viewCheats');

    const kinveyCheatsUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/cheats";
    const kinveyAuthHeaders = {
        //'Authorization': "Kinvey " + sessionStorage.getItem('authToken')
        'Authorization': "Basic " + btoa("guest1:guest1")
    };

    $.ajax({
        method: "GET",
        url: kinveyCheatsUrl,
        headers: kinveyAuthHeaders,
        success: loadUserCheatsSuccess,
        error: handleAjaxError
    });
}

function loadUserCheatsSuccess(cheats) {
    showInfo('Cheats loaded.');
    let info = $('<h5 class="textInfo">').text("Your cheats");
    let username = $('<h4 class="textTitle">').text('Welcome back ' + JSON.stringify($('#loginUser').val()).replace(/"/g, "") + ' here are the cheats you have posted.');
    let arr = [];
    if (cheats.length == 0) {
        $('#cheats').text('You haven\'t posted any cheats.')
    }

    else {
        let cheatsTable = $('<table class="tableFormat">')
            .append($('<tr>').append(
                '<th>Game</th>',
                '<th>Cheat</th>',
                '<th>Description</th>',
                '<th>Tags</th>'
            ));

        for (let cheat of cheats) {
            arr.push(cheat.game);
        }

        var unique = arr.filter(onlyUnique);

        function onlyUnique(value, index, self) {
            return self.indexOf(value) === index;
        }

        let result = unique.sort();

        for (i = 0; i < result.length; i++) {
            for (let cheat of cheats) {
                if (result[i] == cheat.game && cheat.user == $('#loginUser').val()) {
                    cheatsTable.append($('<tr>').append(
                        $('<td>').text(cheat.game),
                        $('<td>').text(cheat.cheat),
                        $('<td>').text(cheat.description),
                        $('<td>').text(cheat.tags)
                    ))
                }
            }
        }
        $('#cheats').append(username).append(info).append(cheatsTable);
    }
}

function showAddCheatView() {
    showView('viewAddCheat')
}

function createCheat() {
    const kinveyCheatsUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/cheats";
    const kinveyAuthHeaders = {
        'Authorization': "Kinvey " + sessionStorage.getItem('authToken')
    };

    let cheatData = {
        game: $('#gameTitle').val(),
        cheat: $('#gameCheat').val(),
        description: $('#cheatDescription').val(),
        tags: $('#cheatTags').val(),
        user: $('#loginUser').val()
    };

    $.ajax({
        method: "POST",
        url: kinveyCheatsUrl,
        headers: kinveyAuthHeaders,
        data: cheatData,
        success: createCheatSuccess,
        error: handleAjaxError
    });

    function createCheatSuccess() {
        document.getElementById("formAddCheats").reset();
        listCheats();
        showInfo('Cheat created.');
    }
}

function showProfile() {
    const kinveyProfileUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/";
    const kinveyAuthHeaders = {
        'Authorization': "Kinvey " + sessionStorage.getItem('authToken')
    };

    $.ajax({
        method: "GET",
        url: kinveyProfileUrl,
        headers: kinveyAuthHeaders,
        success: listUserCheats,
        error: handleAjaxError
    });
}

function logout() {
    sessionStorage.clear();
    document.getElementById("formLogin").reset();
    document.getElementById("formRegister").reset();
    showHideMenuLinks();
    showView('viewHome');
}
