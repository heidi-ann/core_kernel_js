////////////////////////////////////////////////////////////////////////////////
// Start: copy from js_of_ocaml

//Provides: ROTL32
function ROTL32(x,n) { return ((x << n) | (x >>> (32-n))); }

//Provides: MIX
//Requires: caml_mul, ROTL32
function MIX(h,d) {
  d = caml_mul(d, 0xcc9e2d51);
  d = ROTL32(d, 15);
  d = caml_mul(d, 0x1b873593);
  h ^= d;
  h = ROTL32(h, 13);
  return ((((h * 5)|0) + 0xe6546b64)|0);
}

//Provides: FINAL_MIX
//Requires: caml_mul
function FINAL_MIX(h) {
  h ^= h >>> 16;
  h = caml_mul (h, 0x85ebca6b);
  h ^= h >>> 13;
  h = caml_mul (h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h;
}

//Provides: caml_hash_mix_string_str
//Requires: MIX
function caml_hash_mix_string_str(h, s) {
  var len = s.length, i, w;
  for (i = 0; i + 4 <= len; i += 4) {
    w = s.charCodeAt(i)
      | (s.charCodeAt(i+1) << 8)
      | (s.charCodeAt(i+2) << 16)
      | (s.charCodeAt(i+3) << 24);
    h = MIX(h, w);
  }
  w = 0;
  switch (len & 3) {
  case 3: w  = s.charCodeAt(i+2) << 16;
  case 2: w |= s.charCodeAt(i+1) << 8;
  case 1: w |= s.charCodeAt(i);
    h = MIX(h, w);
  default:
  }
  h ^= len;
  return h;
}

// End: copy from js_of_ocaml
////////////////////////////////////////////////////////////////////////////////

//Provides: caml_hash_string
//Requires: caml_hash_mix_string_str, FINAL_MIX
function caml_hash_string(s) {
  var h = caml_hash_mix_string_str(0, s.getFullBytes());
  h = FINAL_MIX(h)
  return h & 0x3FFFFFFF;
}
