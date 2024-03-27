import Janus from './janus';

export function startStream(streaming, selectedStream) {
	Janus.log("Selected video id #" + selectedStream);
	if(selectedStream === undefined || selectedStream === null) {
		return;
	}
	var body = { request: "watch", id: parseInt(selectedStream) };
	streaming.send({"message": body});
	// No remote video yet
}

export function subscribeStreaming(janus, opaqueId, callback) {
    let streaming = null;
	var stropaqueId = "streaming-"+Janus.randomString(12);
    janus.attach(
		{
			plugin: "janus.plugin.streaming",
			opaqueId: stropaqueId,
			success: function(pluginHandle) {
				streaming = pluginHandle;
				Janus.log("Plugin attached! (" + streaming.getPlugin() + ", id=" + streaming.getId() + ")");
				// Setup streaming session
				// $('#update-streams').click(updateStreamsList);

				var body = { request: "list" };
				Janus.debug("Sending message (" + JSON.stringify(body) + ")");
				streaming.send({message: body, success: function(result) {
					if(result["list"] !== undefined && result["list"] !== null) {
						var list = result["list"];
						Janus.log("Got a list of available streams");
						Janus.log(list);
						for(var mp in list) {
							Janus.log("  >> [" + list[mp]["id"] + "] " + list[mp]["description"] + " (" + list[mp]["type"] + ")");
						}
						callback(streaming, "list", list);
					}
				}});
			},
			error: function(error) {
                Janus.error("  -- Error attaching plugin...", error);
                callback(streaming, "error", error);
			},
			iceState: function(state) {
				Janus.log("ICE state changed to " + state);
			},
			webrtcState: function(on) {
				Janus.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
			},
			slowLink: function(uplink, lost, mid) {
				Janus.warn("Janus reports problems " + (uplink ? "sending" : "receiving") +
					" packets on mid " + mid + " (" + lost + " lost packets)");
			},
			onmessage: function(msg, jsep) {
				Janus.debug(" ::: Got a message :::", msg);
				let result = msg["result"];
				if(result) {
					if(result["status"]) {
						let status = result["status"];
						if(status === 'starting')
							callback(streaming, "starting");
						else if(status === 'started')
							callback(streaming, "started");
						else if(status === 'stopped'){
							let body = { request: "stop" };
							streaming.send({ message: body });
							streaming.hangup();
						}		
					} else if(msg["streaming"] === "event") {
						// Does this event refer to a mid in particular?
						let mid = result["mid"] ? result["mid"] : "0";
						// Is simulcast in place?
						let substream = result["substream"];
						let temporal = result["temporal"];
						if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
							if(!simulcastStarted[mid]) {
								simulcastStarted[mid] = true;
								callback(streaming, "addsimulcastStarted");
							}
							// We just received notice that there's been a switch, update the buttons
							callback(streaming, "updatesimulcastStarted");
						}
						// Is VP9/SVC in place?
						let spatial = result["spatial_layer"];
						temporal = result["temporal_layer"];
						if((spatial !== null && spatial !== undefined) || (temporal !== null && temporal !== undefined)) {
							if(!svcStarted[mid]) {
								svcStarted[mid] = true;
								callback(streaming, "addsvcStarted");
							}
							// We just received notice that there's been a switch, update the buttons
							callback(streaming, "updatesvcStarted");
						}
					}
				} else if(msg["error"]) {
					Janus.error(msg["error"]);
					let body = { request: "stop" };
					streaming.send({ message: body });
					streaming.hangup();
					return;
				}
				if(jsep) {
					Janus.debug("Handling SDP as well...", jsep);
					let stereo = (jsep.sdp.indexOf("stereo=1") !== -1);
					// Offer from the plugin, let's answer
					streaming.createAnswer(
						{
							jsep: jsep,
							// We only specify data channels here, as this way in
							// case they were offered we'll enable them. Since we
							// don't mention audio or video tracks, we autoaccept them
							// as recvonly (since we won't capture anything ourselves)
							tracks: [
								{ type: 'data' }
							],
							customizeSdp: function(jsep) {
								if(stereo && jsep.sdp.indexOf("stereo=1") == -1) {
									// Make sure that our offer contains stereo too
									jsep.sdp = jsep.sdp.replace("useinbandfec=1", "useinbandfec=1;stereo=1");
								}
							},
							success: function(jsep) {
								Janus.debug("Got SDP!", jsep);
								let body = { request: "start" };
								streaming.send({ message: body, jsep: jsep });
							},
							error: function(error) {
								Janus.error("WebRTC error:", error);
							}
						});
				}
			},
			onremotetrack: function(track, mid, on, metadata) {
				Janus.debug(
					"Remote track (mid=" + mid + ") " +
					(on ? "added" : "removed") +
					(metadata ? " (" + metadata.reason + ") ": "") + ":", track
				);
				let mstreamId = "mstream"+mid;
				
				if(!on) {
					Janus.log("[janus streaming util]: stream is not on, returing.");
					return;
				}
				// If we're here, a new track was added
				let stream = null;
				if(track.kind === "audio") {
					// New audio track: create a stream out of it, and use a hidden <audio> element
					stream = new MediaStream([track]);
					Janus.log("Created remote audio stream:", stream);
				} else {
					// New video track: create a stream out of it
					stream = new MediaStream([track]);
					Janus.log("Created remote video stream:", stream);
					callback(streaming, "onremotestream", stream);
				}
			},
			ondataopen: function(label, protocol) {
				Janus.log("The DataChannel is available!");
				callback(streaming, "ondataopen", label);
			},
			ondata: function(data) {
				Janus.debug("We got data from the DataChannel!", data);
				callback(streaming, "ondata", data);
			},
			oncleanup: function() {
				callback(streaming, "oncleanup");				
			},
			onlocalstream: function(stream) {
				// The subscriber stream is recvonly, we don't expect anything here
			},
        });
    return streaming;
}