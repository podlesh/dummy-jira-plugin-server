define('DashboardItem', ['underscore', 'jquery', 'wrm/context-path'], function (_, $, contextPath) {
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

        var usedFilterData = undefined;

        var filterId = propertiesValue(preferences, 'filterId');
        var configuredJql = propertiesValue(preferences, 'jql');
        var jql;
        if (_.isNumber(filterId) || (_.isString(filterId) && filterId.match('^[0-9]+$'))) {
            jql = self.fetchFilterData(filterId).then(function (data) {
                usedFilterData = data;
                return data.jql;
            });
        } else {
            jql = Promise.resolve(configuredJql);
        }

        jql.then(self.requestData).then(function (data) {
            self.API.hideLoadingBar();
            self.issues = data.issues;
            var newHtml = Dashboard.Item.Templates.IssueList({
                issues: self.issues,
                filterName: _.isObject(usedFilterData) ? usedFilterData.name : null
            });
            $element.empty().html(newHtml);
            self.API.resize();
            $element.find("#refreshButton", $element).click(function (event) {
                event.preventDefault();
                self.render(context, preferences);
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
        $element.empty().html(Dashboard.Item.Templates.Config());
        this.API.once("afterRender", this.API.resize);
        var self = this;
        var $form = $("form", $element);

        var $inputJQL = $("input[name='jql']", $form);

        //fill current data
        $inputJQL.val(propertiesValue(preferences, 'jql'));

        var oldFilterId = propertiesValue(preferences, 'filterId');
        var seenFilters = {};

        //fill the filters
        $.ajax({
            method: "GET",
            url: contextPath() + "/rest/roadmap-plugin/1.0/filters"
        }).then(function (data) {
            _.each(data, function(filter) {
                seenFilters[filter.id] = filter.jql;
            });
            var $section = $("#filterSelSection", $form);
            $section.empty().html(Dashboard.Item.Templates.FilterSelector({
                contextPath: contextPath(),
                filters: data,
                selectedFilterId: oldFilterId
            }));
            $section.show();
            var $filterIdSelect = $("#filterIdSelect", $section);
            var changeHandler = function() {
                var filterId = $filterIdSelect.val();
                if (filterId && filterId > 0) {
                    filterId = parseInt(filterId);
                    $inputJQL.prop('disabled', true);
                    (_.has(seenFilters, filterId) ? Promise.resolve(seenFilters[filterId])
                        : self.fetchFilterData(filterId).then(function (data) {
                            return data.jql;
                        }))
                        .then(function (jql) {
                            seenFilters[filterId] = jql;
                            $inputJQL.val(jql);
                        });
                } else {
                    $inputJQL.prop('disabled', false);
                }
            };
            $filterIdSelect.change(changeHandler);
            self.API.resize();
            changeHandler();
        });

        $(".cancel", $form).click(_.bind(function () {
            if (preferences['jql'])
                this.API.closeEdit();
        }, this));
        $form.submit(_.bind(function (event) {
            event.preventDefault();

            var preferences = getPreferencesFromForm($form);
            if (_.has(preferences, 'filterId')) {
                if (preferences.filterId <= 0) {
                    delete preferences.filterId;
                } else if (_.has(seenFilters, preferences.filterId)) {
                    preferences['jql'] = seenFilters[preferences.filterId];
                }
            }
            var newJql = preferences['jql'];
            if (newJql) {
                //do the request once, for validation
                this.API.showLoadingBar();
                // noinspection JSUnusedLocalSymbols
                this.requestData(newJql).then(function () {
                    //ok, good
                    self.API.savePreferences(preferences);
                    self.API.hideLoadingBar();
                }, function (jqXHR, textStatus, errorThrown) {
                    self.API.hideLoadingBar();
                    //display an error
                    AJS.messages.error({
                        title: "Invalid JQL"
                    });
                    self.API.resize();
                    self.API.once("afterRender", self.API.resize);
                });
            }
        }, this));
    };

    function getPreferencesFromForm($form) {
        var preferencesArray = $form.serializeArray();
        var preferencesObject = {};

        preferencesArray.forEach(function (element) {
            var value = element.value;
            if (element.name.endsWith('Id')) {
                value = parseInt(value);
            }
            preferencesObject[element.name] = value;
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

    DashboardItem.prototype.fetchFilterData = function (filterId, fallbackValue) {
        filterId = parseInt(filterId);
        //note: jquery in JIRA is quite old and does not properly chain promises --> create new ES promise
        return new Promise(function (resolve, reject) {
            $.ajax({
                method: "GET",
                url: contextPath() + "/rest/api/2/filter/" + filterId
            }).then(function (data) {
                resolve(data);
            }, function () {
                reject(fallbackValue);
            });
        });
    };


    return DashboardItem;
});