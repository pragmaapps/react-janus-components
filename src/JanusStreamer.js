import React, { useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import Janus from './utils/janus';
import { subscribeStreaming, startStream } from './utils/streaming';
import JanusPlayer from './JanusPlayer';

const JanusStreamer = ({ janus, opaqueId }) => {
    const videoArea = useRef(null);
    const [playerState, setPlayerState] = useState("Ready");
    const [streaming, setStreaming] = useState(null);
    const [list, setList] = useState(null);

    let mystream = null;

    const streamingCallback = (_streaming, eventType, data) => {
        setStreaming(_streaming);
        if(eventType === "onremotestream"){
            mystream = data;
            const videoContainer = videoArea.current;
            const videoPlayer = videoContainer.querySelector(".janus-video-player")

            Janus.attachMediaStream(videoPlayer, mystream);
            if (_streaming.webrtcStuff.pc.iceConnectionState !== "completed" &&
            _streaming.webrtcStuff.pc.iceConnectionState !== "connected") {
                setPlayerState("Live");
            }
            var videoTracks = mystream.getVideoTracks();
            if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                setPlayerState("Error");
            }
        }else if(eventType === "oncleanup"){
            setPlayerState("Paused");
        }else if(eventType === "error"){
            setPlayerState("Error");
        }else if(eventType === "list"){
            setList(data);
            startStream(_streaming, 1);
        }
    }
    
    useEffect(() => {
        if(!janus ){
            return;
        }
        subscribeStreaming(janus, opaqueId, streamingCallback);
    }, [janus])

    return (
        <div className="janus-subscriber">
            <div className="janus-video">
                <JanusPlayer 
                    ref={videoArea}
                    isPublisher={false}
                    status={playerState}
                />
            </div>
        </div>
    )
};

export default JanusStreamer;