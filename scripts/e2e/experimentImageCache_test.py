import gzip
import hashlib
import importlib.util
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("cache", Path(__file__).with_name("experimentImageCache.py"))
cache = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cache)

class ArchiveValidationTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "images.tar"
        self.layer = b"layer bytes"
        self.config = json.dumps({
            "architecture": "amd64", "os": "linux",
            "rootfs": {"diff_ids": ["sha256:" + hashlib.sha256(self.layer).hexdigest()]},
        }).encode()
        self.original = cache.IMAGES
        cache.IMAGES = {"registry/image:tag": hashlib.sha256(self.config).hexdigest()}
        self.addCleanup(setattr, cache, "IMAGES", self.original)

    def archive(self, tag="registry/image:tag", config=None, layer=None, layer_path="layer.tar"):
        config = self.config if config is None else config
        layer = self.layer if layer is None else layer
        manifest = json.dumps([{"Config": "config.json", "RepoTags": [tag], "Layers": [layer_path]}]).encode()
        with tarfile.open(self.path, "w") as archive:
            for name, data in [("manifest.json", manifest), ("config.json", config), (layer_path, layer)]:
                member = tarfile.TarInfo(name)
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))

    def test_accepts_fixed_config(self):
        self.archive()
        cache.validate(self.path)

    def test_rejects_unknown_tag(self):
        self.archive(tag="registry/image:other")
        with self.assertRaises(ValueError):
            cache.validate(self.path)

    def test_rejects_modified_config(self):
        self.archive(config=b'{}')
        with self.assertRaises(ValueError):
            cache.validate(self.path)

    def test_accepts_gzip_layer_with_matching_diff_id(self):
        self.archive(layer=gzip.compress(self.layer))
        cache.validate(self.path)

    def test_rejects_modified_layer(self):
        self.archive(layer=b"modified")
        with self.assertRaises(ValueError):
            cache.validate(self.path)

    def test_rejects_path_traversal(self):
        self.archive(layer_path="../layer.tar")
        with self.assertRaises(ValueError):
            cache.validate(self.path)

    def test_rejects_symlink(self):
        self.archive()
        with tarfile.open(self.path, "a") as archive:
            member = tarfile.TarInfo("link")
            member.type = tarfile.SYMTYPE
            member.linkname = "config.json"
            archive.addfile(member)
        with self.assertRaises(ValueError):
            cache.validate(self.path)

    def test_rejects_duplicate_manifest(self):
        self.archive()
        with tarfile.open(self.path, "a") as archive:
            data = b'[]'
            member = tarfile.TarInfo("manifest.json")
            member.size = len(data)
            archive.addfile(member, io.BytesIO(data))
        with self.assertRaises(ValueError):
            cache.validate(self.path)

    def test_rejects_truncated_archive(self):
        self.path.write_bytes(b'invalid')
        with self.assertRaises(tarfile.TarError):
            cache.validate(self.path)

if __name__ == "__main__":
    unittest.main()
