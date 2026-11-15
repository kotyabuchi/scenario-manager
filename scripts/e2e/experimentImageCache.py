#!/usr/bin/env python3
"""CI 実験用の固定公式イメージアーカイブを検証する。"""
import gzip
import hashlib
import json
import os
import subprocess
import sys
import tarfile
import time
from pathlib import Path, PurePosixPath

IMAGES = {
    "public.ecr.aws/supabase/postgres:17.6.1.075": "0fab7a426fa7aba838f6e4c746f975032237934f4ca5ace1a7222ba88deaacf7",
    "public.ecr.aws/supabase/kong:2.8.1": "3cefb958bcd694597b65adc00053a762b1f9a6df3c6031af528d052d75a64e1a",
    "public.ecr.aws/supabase/postgrest:v14.3": "8fef2fc016f1e9d785424f0d1362a7dc6b53c3519e89cb965d81419137f3fb41",
    "public.ecr.aws/supabase/gotrue:v2.186.0": "1a00f324d1ea23e5938de070ef2571cc8be5a7dbcd4c0be77e282e0aa1d1cae2",
    "public.ecr.aws/supabase/storage-api:v1.35.3": "d2308c7679ad90ca9445ef52612d7dfaca908776294943db175d8ead0205f3e0",
}

INDEX_DIGESTS = {
    "public.ecr.aws/supabase/postgres:17.6.1.075": "82a04ba6c05f60950a74ae46be3726abb18d06ee44da936276fd782e72e36855",
    "public.ecr.aws/supabase/kong:2.8.1": "1b53405d8680a09d6f44494b7990bf7da2ea43f84a258c59717d4539abf09f6d",
    "public.ecr.aws/supabase/postgrest:v14.3": "7c5840727ad683b0fdbfb9810930665b34f8b44884a4dc740aa8844748a2b85e",
    "public.ecr.aws/supabase/gotrue:v2.186.0": "f2112b9289422f205df4ea15b8b550d425ae42528ea54521faa32cc7b62490de",
    "public.ecr.aws/supabase/storage-api:v1.35.3": "5a3ecdc67dbe9e88a56810b5b2f432f2d93708dcb4dc9de34e78e342b390eb4d",
}

def validate(path):
    with tarfile.open(path, "r:") as archive:
        members = archive.getmembers()
        names = [member.name for member in members]
        if len(names) != len(set(names)):
            raise ValueError("duplicate archive entries")
        for member in members:
            name = PurePosixPath(member.name)
            if name.is_absolute() or ".." in name.parts or "\\" in member.name or not (member.isfile() or member.isdir()):
                raise ValueError("unsafe archive entry")
        manifest_file = archive.extractfile("manifest.json")
        if manifest_file is None:
            raise ValueError("manifest missing")
        manifest = json.load(manifest_file)
        if not isinstance(manifest, list) or len(manifest) != len(IMAGES):
            raise ValueError("unexpected image count")
        found = {}
        for entry in manifest:
            tags = entry.get("RepoTags")
            if not isinstance(tags, list) or len(tags) != 1 or tags[0] not in IMAGES or tags[0] in found:
                raise ValueError("unexpected or duplicate image tag")
            config_file = archive.extractfile(entry["Config"])
            if config_file is None:
                raise ValueError("config missing")
            config = config_file.read(1048577)
            if len(config) > 1048576:
                raise ValueError("config too large")
            digest = hashlib.sha256(config).hexdigest()
            if digest != IMAGES[tags[0]]:
                raise ValueError("image config digest mismatch")
            rootfs = json.loads(config).get("rootfs", {})
            diff_ids = rootfs.get("diff_ids")
            layers = entry.get("Layers")
            if not isinstance(diff_ids, list) or not isinstance(layers, list) or len(diff_ids) != len(layers):
                raise ValueError("layer count mismatch")
            for layer_path, diff_id in zip(layers, diff_ids):
                layer = archive.extractfile(layer_path)
                if layer is None:
                    raise ValueError("layer missing")
                prefix = layer.read(2)
                layer.seek(0)
                stream = gzip.GzipFile(fileobj=layer) if prefix == b"\x1f\x8b" else layer
                layer_hash = hashlib.sha256()
                while chunk := stream.read(1024 * 1024):
                    layer_hash.update(chunk)
                if f"sha256:{layer_hash.hexdigest()}" != diff_id:
                    raise ValueError("layer digest mismatch")
            found[tags[0]] = digest
        if found != IMAGES:
            raise ValueError("image set mismatch")
    print(f"validated {len(found)} official image configurations; archive bytes={path.stat().st_size}")

def measure(name, path, operation):
    started = time.monotonic()
    status = "failed"
    try:
        result = operation()
        status = "ok"
        return result
    finally:
        print("E2E_IMAGE_CACHE " + json.dumps({
            "phase": name, "status": status,
            "elapsed_ms": round((time.monotonic() - started) * 1000),
            "archive_bytes": path.stat().st_size if path.is_file() else 0,
        }), flush=True)

def main():
    path = Path(os.environ["RUNNER_TEMP"]) / "e2e-image-cache" / "images.tar"
    if sys.argv[1] == "save":
        path.parent.mkdir(parents=True, exist_ok=True)
        measure("save", path, lambda: subprocess.run(
            ["docker", "save", "-o", str(path), *IMAGES], check=True, timeout=900,
        ))
        measure("validate_save", path, lambda: validate(path))
    elif sys.argv[1] == "load":
        measure("validate_load", path, lambda: validate(path))
        measure("load", path, lambda: subprocess.run(
            ["docker", "load", "-i", str(path)], check=True, timeout=900,
        ))
        def inspect():
            for image, config_digest in IMAGES.items():
                result = subprocess.run(
                    ["docker", "image", "inspect", "--format", "{{.Id}} {{.Os}} {{.Architecture}}", image],
                    check=True, capture_output=True, text=True, timeout=30,
                ).stdout.strip().split()
                allowed_ids = {f"sha256:{config_digest}", f"sha256:{INDEX_DIGESTS[image]}"}
                if len(result) != 3 or result[0] not in allowed_ids or result[1:] != ["linux", "amd64"]:
                    raise ValueError("loaded image identity mismatch")
        measure("inspect_load", path, inspect)
    else:
        raise ValueError("unknown command")

if __name__ == "__main__":
    main()
