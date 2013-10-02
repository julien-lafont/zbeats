package controllers

import scala.concurrent._
import scala.concurrent.duration._

import akka.actor._
import akka.pattern.ask
import akka.util.Timeout

import play.api._
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.json._
import play.api.libs.concurrent._
import play.api.mvc.WebSocket.FrameFormatter
import java.util.concurrent.atomic.AtomicLong

// Implicits
import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._

import org.mandubian.actorroom._

class Receiver extends Actor {
  def receive = {
    case Received(from, js: JsValue) =>
      (js \ "msg").asOpt[String] match {
        case None => play.Logger.error("couldn't msg in websocket event")
        case Some(s) =>
          play.Logger.info(s"received $s")
          context.parent ! Broadcast(from, Json.obj("msg" -> s))
      }
  }
}

object Application extends Controller {

  implicit val msgFormatter = new AdminMsgFormatter[JsValue]{
    def connected(id: String) = Json.obj("kind" -> "connected", "id" -> id)
    def disconnected(id: String) = Json.obj("kind" -> "disconnected", "id" -> id)
    def error(id: String, msg: String) = Json.obj("kind" -> "error", "id" -> id, "msg" -> msg)
  }

  var rooms = scala.collection.mutable.HashMap[String, Room]()
  private val generator = new AtomicLong(System.currentTimeMillis())

  def index = Action {
    Ok(views.html.index())
  }


  def create = Action { implicit request =>
    val roomId = java.lang.Long.toString(generator.incrementAndGet(), 26)
    println(s"Create new room $roomId")
    rooms.put(roomId, Room())
    Ok(views.html.room(roomId, "creator"))
  }

  def join(roomId: String) = Action { implicit request =>
    rooms.get(roomId)
      .map { _ => Ok(views.html.room(roomId, "guest")) }
      .getOrElse(NotFound)
  }


  def websocketJs(roomId: String, id: String) = Action { implicit request =>
    Ok(views.js.websocket(roomId, id))
  }

  def websocket(roomId: String, id: String) = rooms(roomId).websocket[Receiver, JsValue](id)

}
