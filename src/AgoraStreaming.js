import React, { useEffect, useRef, useState } from "react";
import { Button, Box } from "@chakra-ui/react";
import AgoraRTC from "agora-rtc-sdk";

function AgoraStreaming(props) {
  let rtc = {
    client: null,
    joined: false,
    published: false,
    localStream: null,
    remoteStreams: [],
    params: {},
  };

  var option = {
    appID: "ac53cc49a89d41f382f211055ce7772e",
    channel: "demoChannel",
    uid: null,
    token: "",
    key: "",
    secret: "",
  };

  const [role, setRole] = useState(null);
  console.log("role", role);
  function joinChannel(role) {
    // Create a client
    setRole(role);
    rtc.client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
    // Initialize the client
    rtc.client.init(
      option.appID,
      function () {
        console.log("init success");

        // Join a channel
        rtc.client.join(
          option.token ? option.token : null,
          option.channel,
          option.uid ? +option.uid : null,
          function (uid) {
            console.log(
              "join channel: " + option.channel + " success, uid: " + uid
            );
            rtc.params.uid = uid;
            if (role === "host") {
              rtc.client.setClientRole("host");
              // Create a local stream
              rtc.localStream = AgoraRTC.createStream({
                streamID: rtc.params.uid,
                audio: true,
                video: true,
                screen: false,
              });

              // Initialize the local stream
              rtc.localStream.init(
                function () {
                  console.log("init local stream success");
                  rtc.localStream.play("local_stream");
                  rtc.client.publish(rtc.localStream, function (err) {
                    console.log("publish failed");
                    console.error(err);
                  });
                },
                function (err) {
                  console.error("init local stream failed ", err);
                }
              );

              rtc.client.on("connection-state-change", function (evt) {
                console.log("audience", evt);
              });
            }
            if (role === "audience") {
              rtc.client.on("connection-state-change", function (evt) {
                console.log("audience", evt);
              });

              rtc.client.on("stream-added", function (evt) {
                var remoteStream = evt.stream;
                var id = remoteStream.getId();
                if (id !== rtc.params.uid) {
                  rtc.client.subscribe(remoteStream, function (err) {
                    console.log("stream subscribe failed", err);
                  });
                }
                console.log("stream-added remote-uid: ", id);
              });

              rtc.client.on("stream-removed", function (evt) {
                var remoteStream = evt.stream;
                var id = remoteStream.getId();
                console.log("stream-removed remote-uid: ", id);
              });

              rtc.client.on("stream-subscribed", function (evt) {
                var remoteStream = evt.stream;
                var id = remoteStream.getId();
                remoteStream.play("remote_video_");
                console.log("stream-subscribed remote-uid: ", id);
              });

              rtc.client.on("stream-unsubscribed", function (evt) {
                var remoteStream = evt.stream;
                var id = remoteStream.getId();
                remoteStream.pause("remote_video_");
                console.log("stream-unsubscribed remote-uid: ", id);
              });
            }
          },
          function (err) {
            console.error("client join failed", err);
          }
        );
      },
      (err) => {
        console.error(err);
      }
    );
  }

  function leaveEventHost(params) {
    rtc.client.unpublish(rtc.localStream, function (err) {
      console.log("publish failed");
      console.error(err);
    });
    rtc.client.leave(function (ev) {
      console.log(ev);
    });
  }

  function leaveEventAudience(params) {
    rtc.client.leave(
      function () {
        console.log("client leaves channel");
        //……
      },
      function (err) {
        console.log("client leave failed ", err);
        //error handling
      }
    );
  }

  return (
    <Box>
      <Button onClick={() => joinChannel("host")}>Join Channel as Host</Button>
      <Button onClick={() => joinChannel("audience")}>
        Join Channel as Audience
      </Button>
      <Button onClick={() => leaveEventHost("host")}>Leave Event Host</Button>
      <Button onClick={() => leaveEventAudience("audience")}>
        Leave Event Audience
      </Button>
      <Box
        display={role === "audience" ? "none" : "block"}
        id="local_stream"
        className="local_stream"
        style={{ width: "400px", height: "800px" }}
      ></Box>
      <Box
        // display={role === "audience" ? "block" : "none"}
        rotate={"-180deg"}
        id="remote_video_"
        style={{ width: "400px", height: "800px" }}
      />
    </Box>
  );
}
// const AgoraStreaming = () => {
//   const remoteVideoRef = useRef(null);

//   useEffect(() => {
//     // Initialize Agora SDK
//     const client = AgoraRTC.createClient({ mode: 'live', codec: 'h264' });
//     const appId = 'ac53cc49a89d41f382f211055ce7772e';
//     client.init(appId);

//     // Join a channel
//     const channelName = 'demoChannel';
//     client.join(null, channelName, null, (uid) => {
//       // Create a local audio and video track
//       const localStream = AgoraRTC.createStream({
//         video: true,
//         audio: true,
//       });
//       localStream.init(() => {
//         // Play the local stream
//         localStream.play('local-stream');

//         // Publish the local stream to the channel
//         client.publish(localStream);

//         // Subscribe to remote streams
//         client.on('stream-added', (event) => {
//           const remoteStream = event.stream;
//           client.subscribe(remoteStream);
//         });

//         // Play remote stream
//         client.on('stream-subscribed', (event) => {
//           const remoteStream = event.stream;
//           remoteStream.play(remoteVideoRef.current);
//         });
//       });
//     });

//     return () => {
//       client.leave();
//     };
//   }, []);

//   return (
//     <div>
//       <div id="local-stream"></div>
//       <div ref={remoteVideoRef}></div>
//     </div>
//   );
// };

export default AgoraStreaming;
