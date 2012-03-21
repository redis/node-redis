local out = {}
for i=1, #KEYS do
    out[i] = KEYS[i]
end
for i=1, #ARGV do
    out[i+#KEYS] = ARGV[i]
end
return out
