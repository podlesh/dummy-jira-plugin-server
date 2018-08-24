package ut.com.podlesh.atlassian;

import org.junit.Test;
import com.podlesh.atlassian.api.MyPluginComponent;
import com.podlesh.atlassian.impl.MyPluginComponentImpl;

import static org.junit.Assert.assertEquals;

public class MyComponentUnitTest
{
    @Test
    public void testMyName()
    {
        MyPluginComponent component = new MyPluginComponentImpl(null);
        assertEquals("names do not match!", "myComponent",component.getName());
    }
}