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

        //Function to add the click listeners to the initial menu items
        var addInitialListeners = function() {
            return;
        }

        //Function to add project specific click listeners
        var addAdditionalListeners = function() {
            return;
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
        pinegrow.addPluginControlToTopbar(framework, $menu, true, function(){
            addInitialListeners();
        });

        //Adds project specific GitHub menu items
        pinegrow.addEventHandler('on_project_loaded', function(pagenull, project) {
            let targetMenu = document.getElementById('gh-dropdown');
            let newItems = document.createDocumentFragment();
            let listOne = document.createElement('li');
            // rjs: removed variables menuItemOne and menuItemTwo
            listOne.innerHTML = '<a href="#" id="stage-changes">Stage Changes</a>';
            newItems.appendChild(listOne);
            let listTwo = document.createElement('li');
            listTwo.innerHTML = '<a href="#" id="commit-changes">Commit Changes</a>';
            newItems.appendChild(listTwo);
            // rjs: using namedITem is more robust then using hardcoded index-number
            // rjs: this namedItem needs an id on the element <hr> in the menu
            let menuDivider = targetMenu.children.namedItem('ruler-one');
            targetMenu.insertBefore(newItems, menuDivider);
            console.log(targetMenu.children);
            addAdditionalListeners();
        });

        //Removes extra menu items on project close
        pinegrow.addEventHandler('on_project_closed', function(pagenull, project) {
            document.getElementById('stage-changes').remove();
            document.getElementById('commit-changes').remove();
        });
    });
});