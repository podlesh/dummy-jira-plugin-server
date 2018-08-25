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
        this.requestData().done(function (data) {
            self.API.hideLoadingBar();
            self.issues = data.issues;
            console.log(JSON.stringify(data));
            if (self.issues === undefined || self.issues.length === 0) {
                $element.empty().html(Dashboard.Item.Tutorial.Templates.Empty());
            }
            else {
                $element.empty().html(Dashboard.Item.Tutorial.Templates.IssueList({issues: self.issues}));
            }
            self.API.resize();
            $element.find(".submit").click(function (event) {
                event.preventDefault();
                self.render(element, preferences);
            });
        });

        this.API.once("afterRender", this.API.resize);
    };

    DashboardItem.prototype.requestData = function () {
        return $.ajax({
            method: "GET",
            url: contextPath() + "/rest/api/2/search?jql=project=POK"
        });
    };

    return DashboardItem;
});