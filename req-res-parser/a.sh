single="--single unit/type/incr --single unit/type/string --single unit/type/stream-cgroups --single unit/type/stream"

single="--single unit/type/set" &&
sudo ./runtest --log-req-res --force-resp3 --dont-clean $single &&
cat ./tests/tmp/*/stdout.reqres > resp3.reqres &&
sudo ./runtest --log-req-res --dont-clean $single &&
cat ./tests/tmp/*/stdout.reqres > resp2.reqres