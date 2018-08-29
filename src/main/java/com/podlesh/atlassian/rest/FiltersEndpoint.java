package com.podlesh.atlassian.rest;


import com.atlassian.jira.bc.JiraServiceContext;
import com.atlassian.jira.bc.JiraServiceContextImpl;
import com.atlassian.jira.bc.filter.SearchRequestService;
import com.atlassian.jira.component.ComponentAccessor;
import com.atlassian.jira.issue.search.SearchRequest;
import com.atlassian.jira.security.JiraAuthenticationContext;
import com.atlassian.jira.sharing.search.SharedEntitySearchContext;
import com.atlassian.jira.sharing.search.SharedEntitySearchParameters;
import com.atlassian.jira.sharing.search.SharedEntitySearchParametersBuilder;
import com.atlassian.jira.sharing.search.SharedEntitySearchResult;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * A resource of message.
 */
@Path("/filters")
public class FiltersEndpoint {

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public Response filters(@QueryParam("q") String searchFor) {
        SharedEntitySearchResult<SearchRequest> searchResult = findFilters(searchFor);

        final Map<Long, SearchRequest> result = new TreeMap<>();
        for (SearchRequest rslt : searchResult.getResults()) {
            result.put(rslt.getId(), rslt);
        }
        return Response.ok(result).build();
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    @Path("autocomplete")
    public Response autocomplete(@QueryParam("q") String searchFor) {
        SharedEntitySearchResult<SearchRequest> searchResult = findFilters(searchFor);

        final List<AutocompleteItem> result = searchResult.getResults().stream()
                .map(sr -> new AutocompleteItem(sr.getId(), sr.getName()))
                .collect(Collectors.toList());
        return Response.ok(result).build();
    }

    protected SharedEntitySearchResult<SearchRequest> findFilters(@QueryParam("q") String searchFor) {
        SharedEntitySearchParametersBuilder builder = new SharedEntitySearchParametersBuilder()
                .setEntitySearchContext(SharedEntitySearchContext.USE);
        if (searchFor != null && !searchFor.trim().isEmpty()) {
            builder.setName(searchFor);
            builder.setDescription(searchFor);
            builder.setTextSearchMode(SharedEntitySearchParameters.TextSearchMode.WILDCARD);
        }
        SharedEntitySearchParameters searchParameters = builder
                .toSearchParameters();

        JiraAuthenticationContext jiraAuthenticationContext = ComponentAccessor.getJiraAuthenticationContext();
        JiraServiceContext jiraServiceContext = new JiraServiceContextImpl(jiraAuthenticationContext.getLoggedInUser());

        SearchRequestService searchRequestService = ComponentAccessor.getComponent(SearchRequestService.class);

        return searchRequestService
                .search(jiraServiceContext, searchParameters, 0, 100);
    }

    @XmlRootElement(name = "filter")
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class AutocompleteItem {
        @XmlElement
        private Long value;
        @XmlElement
        private String label;
        @XmlElement(name = "img-src")
        private String img;

        public AutocompleteItem(String label, Long value, String img) {
            this.label = label;
            this.value = value;
            this.img = img;
        }

        public AutocompleteItem(Long value, String label) {
            this.value = value;
            this.label = label;
        }

        public Long getValue() {
            return value;
        }

        public String getLabel() {
            return label;
        }

        public String getImg() {
            return img;
        }
    }

}