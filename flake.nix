{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
      };
    in
    {
      devShells."x86_64-linux".default =
        let
          trailbase = pkgs.stdenv.mkDerivation {
            name = "trailbase";
            src = pkgs.fetchurl {
              url = "https://github.com/trailbaseio/trailbase/releases/download/v0.23.6/trailbase_v0.23.6_x86_64_linux.zip";
              hash = "sha256-eIyP8O+GtpgDqWe46IjGTDgES1kmenSdPCAgfLc2/o4=";
            };
            nativeBuildInputs = [ pkgs.unzip ];
            sourceRoot = ".";
            installPhase = ''
              chmod +x trail
              mkdir -p $out/bin
              mv trail $out/bin/trail
            '';
          };
        in
        pkgs.mkShell {
          name = "devenv";
          buildInputs = [ trailbase ];
          shellHook = ''
            echo "Devshell activated."
          '';
        };
    };
}
