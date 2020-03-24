import React, { useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import Janus from './utils/janus';
import { subscribeStreaming, startStream } from './utils/streaming';
import JanusStreamPlayer from './JanusStreamPlayer';

const JanusStreamer = React.forwardRef((
    { 
        janus, opaqueId, streamId, enableCustomControl, customVideoControls, overlayImage,
    }, ref ) => {
    const videoArea = ref;
    const [playerState, setPlayerState] = useState("Ready");
    const [streaming, setStreaming] = useState(null);
    const [list, setList] = useState(null);

    let mystream = null;

    const streamingCallback = (_streaming, eventType, data) => {
        setStreaming(_streaming);
        if(eventType === "onremotestream"){
            mystream = data;
            console.log("[Attaching stream to the video element:]",videoArea);
            const videoPlayer = videoArea.current.video.video

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
            startStream(_streaming, streamId);
        }
    }
    
    useEffect(() => {
        if(!janus ){
            return;
        }
        subscribeStreaming(janus, opaqueId, streamingCallback);
    }, [janus])

    return (

        <div>
            <JanusStreamPlayer 
                ref={videoArea}
                isPublisher={false}
                status={playerState}
                customVideoControls={customVideoControls}
                enableCustomControl={enableCustomControl}
                overlayImage={overlayImage}
            />
        </div>
    )
});

export default JanusStreamer;