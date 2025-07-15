import io
import zipfile
from bson import ObjectId

def compress_file(file_data, filename):
    """Compresse un fichier en mémoire."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.writestr(filename, file_data)
    zip_buffer.seek(0)
    return zip_buffer


def save_to_gridfs(fs, zip_buffer, filename):
    """Sauvegarde un fichier compressé dans GridFS."""
    return fs.put(zip_buffer, filename=filename)


def get_file_from_gridfs(fs, file_id):
    """Récupère un fichier depuis GridFS à partir de son ID."""
    return fs.get(ObjectId(file_id))


def delete_file_from_gridfs(fs, file_id):
    """Supprime un fichier de GridFS à partir de son ID."""
    fs.delete(ObjectId(file_id))
