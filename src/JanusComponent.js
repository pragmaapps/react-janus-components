import React, { useRef, useState, useEffect } from 'react';
import Janus from './utils/janus';

const JanusComponent = ({ children, server, isTurnServerEnabled, daqIP }) => {
    const janusEl = useRef(null);
    const [janusInstance, setJanusInstance] = useState(null);

    useEffect(() => {
        // let unmounted = false;
        handleConnection();


        return () => {
            // unmounted = true;
            setJanusInstance(null);
        };
    }, [])

    const handleConnection = () =>{
        Janus.init({ debug: "all", callback: function () {
                if (!Janus.isWebrtcSupported()) {
                    console.log("No WebRTC support... ");
                    return;
                }
                var janus = new Janus({
                    server: server,
					iceServers: null,
                    success: function() {
                        Janus.log("[Janus componet]:Janus connection initiated.")
                        setJanusInstance(janus);
                    },
                    error: function(error) {
						Janus.error(error);
                        setJanusInstance(null);
					},
					destroyed: function() {
						setJanusInstance(null);
					}
                });
            }
        });
    }


    return (
        <div className="janus-container" ref={janusEl}>
            {children && (
                React.cloneElement(children, { janus: janusInstance, createConnection: handleConnection })
            )}
        </div>
    );
}

export default JanusComponent;