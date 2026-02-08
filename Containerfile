FROM trailbase/trailbase

WORKDIR /run/public
COPY dist /run/public

CMD trail run --spa --public-dir /run/public --address 0.0.0.0:4000

