package com.podlesh.atlassian;

import com.atlassian.plugin.Plugin;
import com.atlassian.plugin.PluginAccessor;
import com.atlassian.plugin.PluginParseException;
import com.atlassian.plugin.spring.scanner.annotation.component.Scanned;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.plugin.web.ContextProvider;

import java.util.HashMap;
import java.util.Map;

@Scanned
public class DashboardItemContextProvider implements ContextProvider {

    @ComponentImport
    private final PluginAccessor pluginAccessor;

    public DashboardItemContextProvider(
            @ComponentImport PluginAccessor pluginAccessor
    ) {
        this.pluginAccessor = pluginAccessor;
    }

    @Override
    public void init(final Map<String, String> params) throws PluginParseException {
    }

    @Override
    public Map<String, Object> getContextMap(final Map<String, Object> context) {
        final Map<String, Object> newContext = new HashMap<>(context);
        Plugin plugin = pluginAccessor.getEnabledPlugin("com.podlesh.atlassian.jira.jira-roadmap-planner");
        newContext.put("version", plugin.getPluginInformation().getVersion());
        newContext.put("pluginName", plugin.getName());
        return newContext;
    }
}