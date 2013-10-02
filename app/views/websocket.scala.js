@(roomId: String, id: String)(implicit r: RequestHeader)

$(function() {

    var creator = "@id" == "creator"
    var roomId = "@roomId"

    var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket;
    var wsSocket = new WS("@routes.Application.websocket(roomId, id).webSocketURL()");

    var sendMessage = function() {
        wsSocket.send(JSON.stringify(
            { msg: $("#msg").val() }
        ))
        $("#msg").val('');
    }

    var receiveEvent = function(event) {
        console.log(event);
        var data = JSON.parse(event.data);
        // Handle errors
        if(data.error) {
            console.log("WS Error ", data.error);
            wsSocket.close();
            // TODO manage error
            return;
        } else {
            // hide waiting box
            if (creator && data.kind == "connected" && data.id == "guest") {
                $("#first").hide()
            }
        }

    }

    wsSocket.onmessage = receiveEvent;

})
