package com.podlesh.atlassian.rest;


import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.Collections;

/**
 * A resource of message.
 */
@Path("/message")
public class ExampleRestResource {

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    @Path("/hello")
    public Response getMessage(@QueryParam("name") String name) {
        return Response.ok(Collections.singletonMap("message", "Hello " + name + " from the REST resource")).build();
    }
}