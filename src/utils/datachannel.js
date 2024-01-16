import Janus from './janus';

export function subscribeDatachannel(janus, opaqueId, callback) {
    let datachannel = null;

    janus.attach(
        {
            plugin: "janus.plugin.streaming",
            opaqueId: opaqueId,
            success: function(pluginHandle) {
                datachannel = pluginHandle;
                Janus.log("Plugin attached! (" + datachannel.getPlugin() + ", id=" + datachannel.getId() + ")");
            },
            error: function(error) {
                Janus.error("  -- Error attaching plugin...", error);
                callback(datachannel, "error", error);
            },      
            onmessage: function(msg, jsep) {
                Janus.debug(" ::: Got a message :::");
                Janus.debug(msg);
                if(jsep !== undefined && jsep !== null) {
                    Janus.debug("Handling SDP as well...");
                    Janus.debug(jsep);
                    // Offer from the plugin, let's answer
                    datachannel.createAnswer(
                        {
                            jsep: jsep,
                            media: { audio: false, video:false, data:true }, // We want data only
                            success: function(jsep) {
                                Janus.debug("Got SDP!");
                                Janus.debug(jsep);
                                var body = { "request": "start" };
                                datachannel.send({"message": body, "jsep": jsep});
                            },                          
                            error: function(error) {
                                Janus.error("WebRTC error:", error);
                            }
                        });
                }
            },
            ondataopen: function(label, protocol) {
                Janus.log("The DataChannel is available!");
            },
            ondata: function(data, label) {
                Janus.log("We got data from the DataChannel!", data);
                callback(datachannel,data);
            },
            onremotestream: function(stream) {
                // The subscriber stream is data only, we don't expect anything here
            },
            onlocalstream: function(stream) {
                // The subscriber stream is recvonly, we don't expect anything here
            },
            oncleanup: function() {
                // The subscriber stream is data only, we don't expect anything here    
            }
        });
    return datachannel;
}