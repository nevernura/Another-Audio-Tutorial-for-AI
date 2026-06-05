import Uploader from "@/components/Uploader";
export default function UploadPage() {
  return (
    <div className="upload">
      <h2>Upload a sound</h2>
      <p className="sub">Drop a file (wav/flac/ogg work everywhere; mp3 needs ffmpeg on the service).</p>
      <Uploader />
    </div>
  );
}
