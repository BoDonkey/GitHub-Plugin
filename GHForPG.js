$(function () {
    $('body').one('pinegrow-ready', function (e, pinegrow) {

        //Add a framework id, it should be unique to this framework and version. Best practice is to define the prefix as a variable that can be used throughout the framework.
        let framework_id = 'shd_github_for_pinegrow';

        //Instantiate a new framework
        var framework = new PgFramework(framework_id, 'GitHub-for-Pinegrow');

        // Define a framework type - if you plan on having multiple versions, this should be the same for each version. 
        framework.type = 'GitHub-for-Pinegrow';

        //Prevent the activation of multiple versions of the framework - if this should be allowed, change to false
        framework.allow_single_type = true;

        //Optional, add a badge to the framework list notify user of new or updated status
        //framework.info_badge = 'v1.0.0';

        //Add a description of the plugin
        framework.description = 'Adds GitHub functionality to Pinegrow';

        //Add a framework  author to be displayed with the framework templates
        framework.author = 'Robert "Bo" Means';

        //Add a website "https://pinegrow.com" or mailto "mailto:info@pinegrow.com" link for redirect on author name click
        framework.author_link = 'https://robertmeans.net';

        // Tell Pinegrow about the framework
        pinegrow.addFramework(framework);

        //uncomment the line below for debugging - opens devtools on Pinegrow Launch
        require('nw.gui').Window.get().showDevTools();

        //Load in the Octokit module
        var frameBase = framework.getBaseUrl();
        console.log({
            frameBase
        });
        var {
            Octokit
        } = require(crsaMakeFileFromUrl(frameBase + '/node_modules/@octokit/rest/dist-node/index.js'));
        console.log({
            Octokit
        });

        var fetchHtmlFragment = async function (htmlLocation) {
            const fs = require('fs');
            try {
                return await fs.readFileSync(htmlLocation, 'utf-8');
            } catch (e) {
                console.error(e);
            }
        }

        //Function to add the click listeners to the initial menu items
        var addInitialListeners = function () {
            //Adds the click listener to the settings menu item
            let settingsMenuItem = document.getElementById('gh-settings');
            settingsMenuItem.addEventListener('click', function () {
                $('#settingsModal').modal('show');
            });
            return;
        }

        //Function to add project specific click listeners
        var addAdditionalListeners = function () {
            return;
        }

        //Function to poulate settings with existing values, clear settings, save new settings.
        var manipulateSettingsFields = function () {
            let userNameField = document.getElementById('gh-user-name');
            let accountTokenField = document.getElementById('gh-token');
            let clearSettingsButton = document.getElementById('gh-clear-settings');
            let saveSettingsButton = document.getElementById('gh-save-settings');
            let cancelSettingsButton = document.getElementById('gh-cancel-settings');
            let userErrorMessage = document.getElementById('gh-username-error');
            let tokenErrorMessage = document.getElementById('gh-token-error');
            let credentialsMessage = document.getElementById('correct-credentials');

            if (localStorage.getItem('gh-settings-user-name')) {
                userNameField.value = localStorage.getItem('gh-settings-user-name');
                accountTokenField.value = localStorage.getItem('gh-settings-token');
            };
            clearSettingsButton.addEventListener('click', function () {
                localStorage.removeItem('gh-settings-user-name');
                localStorage.removeItem('gh-settings-token');
                userNameField.value = '';
                accountTokenField.value = '';
                saveSettingsButton.className = 'btn btn-primary';
                userErrorMessage.style.visibility = 'hidden';
                tokenErrorMessage.style.visibility = 'hidden';
                credentialsMessage.style.visibility = 'hidden';
            });
            saveSettingsButton.addEventListener('click', async function () {
                localStorage.setItem('gh-settings-user-name', userNameField.value);
                localStorage.setItem('gh-settings-token', accountTokenField.value);
                let errorCheck = await verifyGitHubAccount();
                console.log({
                    errorCheck
                });
                if (true === errorCheck) {
                    saveSettingsButton.className = 'btn btn-success';
                    userErrorMessage.style.visibility = 'hidden';
                    tokenErrorMessage.style.visibility = 'hidden';
                    credentialsMessage.style.visibility = 'visible';
                } else if (-1 === errorCheck) {
                    userErrorMessage.style.visibility = 'visible';
                    localstorage.removeItem('gh-settings-user-name');
                    credentialsMessage.style.visibility = 'hidden';
                } else {
                    tokenErrorMessage.style.visibility = 'visible';
                    localStorage.removeItem('gh-settings-token');
                    credentialsMessage.style.visibility = 'hidden';
                }
            });
            cancelSettingsButton.addEventListener('click', function () {
                saveSettingsButton.className = 'btn btn-primary';
                userErrorMessage.style.visibility = 'hidden';
                tokenErrorMessage.style.visibility = 'hidden';
                credentialsMessage.style.visibility = 'hidden';
            })
        }

        //Function to add settings modal to the page
        var addSettingsModal = async function () {
            let modalDiv = document.createElement('div');
            modalDiv.setAttribute('id', 'settingsModalContainer');
            let theApp = document.getElementById('pgapp');
            theApp.appendChild(modalDiv);
            const frameBase = framework.getBaseUrl();
            let modalFile = crsaMakeFileFromUrl(frameBase + '/modal.html');
            let settingsModalContainer = document.getElementById('settingsModalContainer');
            settingsModalContainer.innerHTML = await fetchHtmlFragment(modalFile);
            manipulateSettingsFields();
        }

        //HTML for the main menu
        let $menu = $(`
        <li id="github-menu" class="dropdown">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown"><span>GitHub</span></a>
            <ul class="dropdown-menu" id="gh-dropdown">
                <li><a href="#" id="create-repo">Create New Repo</a></li>
                <li><a href="#" id="clone-repo">Clone Existing Repo</a></li>
                <hr id="ruler-one">
                <li><a href="#" id="gh-settings">Settings...</a></li>
            </ul>
        </li>
        `);

        //Adds the main GitHub menu to Pinegrow upon open
        pinegrow.addPluginControlToTopbar(framework, $menu, true, function () {
            addSettingsModal();
            addInitialListeners();
            // Check if we are opening another project in a new window 
            if (pinegrow.getCurrentProject()) {
                addToGHMenu();
            }
        });

        //Adds project specific GitHub menu items 
        //Replaced anonymous callback function with 'addToGHMenu' to solve problem with opening
        //project in a new window not triggering menu addition 
        pinegrow.addEventHandler('on_project_loaded', addToGHMenu);

        //Removes extra menu items on project close
        pinegrow.addEventHandler('on_project_closed', removeFromGHMenu);

        function addToGHMenu() {
            // first check existence of additional menu to avoid double entries to the GH Menu
            if (!document.getElementById('stage-changes')) {
                let targetMenu = document.getElementById('gh-dropdown');
                let newItems = document.createDocumentFragment();
                let listOne = document.createElement('li');
                // rjs: removed variables menuItemOne and menuItemTwo
                listOne.innerHTML = '<a href="#" id="stage-changes">Stage Changes</a>';
                newItems.appendChild(listOne);
                let listTwo = document.createElement('li');
                listTwo.innerHTML = '<a href="#" id="commit-changes">Commit Changes</a>';
                newItems.appendChild(listTwo);
                // rjs: using namedItem is more robust then using hardcoded index-number
                // rjs: this namedItem needs an id on the element <hr> in the menu
                let menuDivider = targetMenu.children.namedItem('ruler-one');
                targetMenu.insertBefore(newItems, menuDivider);
                addAdditionalListeners();
            }
        }

        function removeFromGHMenu(pagenull, project) {
            document.getElementById('stage-changes').remove();
            document.getElementById('commit-changes').remove();
        }

        async function verifyGitHubAccount() {
            if (localStorage.getItem('gh-settings-token') && localStorage.getItem('gh-settings-user-name')) {
                let userName = localStorage.getItem('gh-settings-user-name');
                console.log({
                    userName
                })
                let token = localStorage.getItem('gh-settings-token');
                //instantiates octokit object with token authorization
                const octokit = new Octokit({
                    type: 'token',
                    auth: token,
                });
                return octokit.users.getAuthenticated()
                .then(isAuthenticated => isAuthenticated.data.login)
                .then(returnedName => (userName === returnedName) ? true : -1)
                .catch(err => console.error(err));
            };
        };
    });
});