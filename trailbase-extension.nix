{
  pkgs ? import <nixpkgs> { },
}:
pkgs.rustPlatform.buildRustPackage {
  name = "trailbase-extension";

  src = pkgs.fetchFromGitHub {
    owner = "trailbaseio";
    repo = "trailbase";
    rev = "69ee3775ea772f14948a6af791ce50bf31434ec3";
    hash = "sha256-hUedZZ4pZmx+p2oltpbk1ndHdFk3Zi2vQKzRBD9v4TM=";
    fetchSubmodules = true;
  };

  buildInputs = with pkgs; [ libclang ];

  cargoHash = "sha256-5v4CeRU2wEywWJsYK5ElfgMzswNgBbTCtwyt+ot9EGc=";

  buildPhase = ''
    cargo build -p trailbase-extension-so --release
  '';
  installPhase = ''
    mkdir -p $out/lib
    cp target/release/libtrailbase.so $out/lib
  '';
}
