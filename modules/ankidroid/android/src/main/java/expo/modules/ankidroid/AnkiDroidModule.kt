package expo.modules.ankidroid

import android.content.ContentResolver
import android.content.ContentValues
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// AnkiDroid's public FlashCards ContentProvider API (com.ichi2.anki.FlashCardsContract)
private const val ANKIDROID_PACKAGE = "com.ichi2.anki"
private const val PERMISSION = "com.ichi2.anki.permission.READ_WRITE_DATABASE"
private const val FIELD_SEPARATOR = "\u001f"
private val BASE_URI: Uri = Uri.parse("content://com.ichi2.anki.flashcards")
private val NOTES_URI: Uri = Uri.withAppendedPath(BASE_URI, "notes")
private val MODELS_URI: Uri = Uri.withAppendedPath(BASE_URI, "models")
private val DECKS_URI: Uri = Uri.withAppendedPath(BASE_URI, "decks")

class AnkiDroidException(message: String, cause: Throwable? = null) :
  CodedException("ERR_ANKIDROID", message, cause)

private data class NoteRow(val modelId: Long, val fields: List<String>, val tags: List<String>, val mod: Long)

private data class ModelRow(val id: Long, val name: String, val fieldNames: List<String>)

class AnkiDroidModule : Module() {
  private val resolver: ContentResolver
    get() = appContext.reactContext?.contentResolver
      ?: throw AnkiDroidException("React context is not available")

  override fun definition() = ModuleDefinition {
    Name("AnkiDroid")

    Function("isInstalled") {
      val packageManager = appContext.reactContext?.packageManager ?: return@Function false
      try {
        packageManager.getPackageInfo(ANKIDROID_PACKAGE, 0)
        true
      } catch (e: PackageManager.NameNotFoundException) {
        false
      }
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, PERMISSION)
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, PERMISSION)
    }

    AsyncFunction("deckNames") {
      query(DECKS_URI, arrayOf("deck_name")) { it.getString(0) }.sorted()
    }

    // `search` uses Anki's search syntax, e.g. deck:"My Deck"
    AsyncFunction("findNotes") { search: String ->
      query(NOTES_URI, arrayOf("_id"), search) { it.getLong(0) }
    }

    // Same shape as AnkiConnect's notesInfo result
    AsyncFunction("notesInfo") { noteIds: List<Long> ->
      val models = mutableMapOf<Long, ModelRow>()
      noteIds.mapNotNull { noteId ->
        val note = loadNote(noteId) ?: return@mapNotNull null
        val model = models.getOrPut(note.modelId) { loadModel(note.modelId) }
        mapOf(
          "noteId" to noteId,
          "modelName" to model.name,
          "tags" to note.tags,
          "mod" to note.mod,
          "fields" to model.fieldNames.mapIndexed { order, name ->
            name to mapOf("value" to note.fields.getOrElse(order) { "" }, "order" to order)
          }.toMap()
        )
      }
    }

    // Updates only the given fields; the rest keep their current values
    AsyncFunction("updateNoteFields") { noteId: Long, fields: Map<String, String> ->
      val note = loadNote(noteId) ?: throw AnkiDroidException("Note $noteId not found")
      val model = loadModel(note.modelId)
      val values = model.fieldNames.mapIndexed { i, name -> fields[name] ?: note.fields.getOrElse(i) { "" } }
      val contentValues = ContentValues().apply { put("flds", values.joinToString(FIELD_SEPARATOR)) }
      val updated = guarded { resolver.update(noteUri(noteId), contentValues, null, null) }
      if (updated < 1) throw AnkiDroidException("Failed to update note $noteId")
    }

    AsyncFunction("modelNamesAndIds") {
      loadModels().associate { it.name to it.id }
    }

    AsyncFunction("modelFieldNames") { modelName: String ->
      loadModels().firstOrNull { it.name == modelName }?.fieldNames
        ?: throw AnkiDroidException("Note type \"$modelName\" not found")
    }
  }

  private fun noteUri(noteId: Long): Uri = Uri.withAppendedPath(NOTES_URI, noteId.toString())

  private fun loadNote(noteId: Long): NoteRow? =
    query(noteUri(noteId), arrayOf("mid", "flds", "tags", "mod")) {
      NoteRow(
        modelId = it.getLong(0),
        fields = it.getString(1).split(FIELD_SEPARATOR),
        tags = it.getString(2).trim().split(Regex("\\s+")).filter(String::isNotEmpty),
        mod = it.getLong(3)
      )
    }.firstOrNull()

  private fun loadModel(modelId: Long): ModelRow =
    query(Uri.withAppendedPath(MODELS_URI, modelId.toString()), arrayOf("_id", "name", "field_names")) { it.toModel() }
      .firstOrNull() ?: throw AnkiDroidException("Note type $modelId not found")

  private fun loadModels(): List<ModelRow> =
    query(MODELS_URI, arrayOf("_id", "name", "field_names")) { it.toModel() }

  private fun Cursor.toModel() = ModelRow(getLong(0), getString(1), getString(2).split(FIELD_SEPARATOR))

  private fun <T> query(uri: Uri, projection: Array<String>, selection: String? = null, map: (Cursor) -> T): List<T> {
    val cursor = guarded { resolver.query(uri, projection, selection, null, null) }
      ?: throw AnkiDroidException("AnkiDroid is not available. Make sure it is installed and has been opened once.")
    return cursor.use { c -> buildList { while (c.moveToNext()) add(map(c)) } }
  }

  private fun <T> guarded(block: () -> T): T =
    try {
      block()
    } catch (e: SecurityException) {
      throw AnkiDroidException("Permission to access AnkiDroid has not been granted", e)
    }
}
