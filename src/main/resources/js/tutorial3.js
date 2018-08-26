define('ExampleDashboardItem', ['underscore', 'jquery', 'wrm/context-path'], function (_, $, contextPath) {
    var DashboardItem = function (API) {
        this.API = API;
        this.issues = [];
    };
    /**
     * Called to render the view for a fully configured dashboard item.
     *
     * @param context The surrounding <div/> context that this items should render into.
     * @param preferences The user preferences saved for this dashboard item (e.g. filter id, number of results...)
     */
    DashboardItem.prototype.render = function (context, preferences) {
        this.API.showLoadingBar();
        var $element = this.$element = $(context).find("#dynamic-content");
        var self = this;
        this.requestData(htmlDecode(preferences['jql'])).done(function (data) {
            self.API.hideLoadingBar();
            self.issues = data.issues;
            if (self.issues === undefined || self.issues.length === 0) {
                $element.empty().html(Dashboard.Item.Tutorial.Templates.Empty());
            }
            else {
                $element.empty().html(Dashboard.Item.Tutorial.Templates.IssueList({issues: self.issues}));
            }
            self.API.resize();
            $element.find(".submit", $element).click(function (event) {
                event.preventDefault();
                self.render($element, preferences);
            });
        });

        this.API.once("afterRender", this.API.resize);
    };

    function htmlDecode(value) {
        return $("<textarea/>").html(value).text();
    }

    function propertiesValue(properties, key, defaultValue) {
        var val = properties[key];
        if (val) return htmlDecode(val);
        if (defaultValue) return defaultValue;
        return '';
    }

    /**
     * Called to render the configuration.
     *
     * @param context The surrounding <div/> context that this items should render into.
     * @param preferences The user preferences saved for this dashboard item (e.g. filter id, number of results...)
     */
    DashboardItem.prototype.renderEdit = function (context, preferences) {
        var $element = this.$element = $(context).find("#dynamic-content");
        $element.empty().html(Dashboard.Item.Tutorial.Templates.Config());
        this.API.once("afterRender", this.API.resize);
        var self = this;
        var $form = $("form", $element);
        var $error = $(".error", $form);
        $error.hide();

        //fill current data
        $("input[name='jql']", $form).attr('value', propertiesValue(preferences, 'jql'));

        $(".cancel", $form).click(_.bind(function () {
            if (preferences['jql'])
                this.API.closeEdit();
        }, this));
        $form.submit(_.bind(function (event) {
            event.preventDefault();

            var preferences = getPreferencesFromForm($form);
            if (preferences['jql']) {
                //do the request once, for validation
                this.API.showLoadingBar();
                this.requestData(preferences['jql']).then(function () {
                    //ok, good
                    self.API.savePreferences(preferences);
                    self.API.hideLoadingBar();
                }, function (jqXHR, textStatus, errorThrown) {
                    self.API.hideLoadingBar();
                    //display an error
                    $error.empty().text("Invalid JQL: " + errorThrown + " / " + textStatus);
                    $error.show();
                });
            }
        }, this));
    };

    function getPreferencesFromForm($form) {
        var preferencesArray = $form.serializeArray();
        var preferencesObject = {};

        preferencesArray.forEach(function (element) {
            preferencesObject[element.name] = element.value;
        });

        console.log("preferences from form: " + JSON.stringify(preferencesObject));
        return preferencesObject;
    }


    DashboardItem.prototype.requestData = function (jql) {
        return $.ajax({
            method: "GET",
            url: contextPath() + "/rest/api/2/search?jql=" + encodeURIComponent(jql)
        });
    };

    return DashboardItem;
});