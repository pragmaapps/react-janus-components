import React, { useRef, useState, useEffect } from 'react';
import $ from 'jquery';
import Janus from './utils/janus';
import { subscribeDatachannel} from './utils/datachannel';
const JanusDatachannel = React.forwardRef((
    {
        janus, opaqueId, streamId
    }, ref) => {

    useEffect(() => {
        let unmounted = false;
        if (!janus && !unmounted) {
            return;
        }

        if (!unmounted) {
            subscribeDatachannel(janus, opaqueId, datachannelCallback);
        }
        return () => {
            unmounted = true;
        };
    }, [janus])
    const datachannelCallback = (_datachannel,data) => {
        console.log("[React Janus component][data we received from dataChannel]", data);
    }
    return (
        <div>
        </div>
    )
});

export default JanusDatachannel;