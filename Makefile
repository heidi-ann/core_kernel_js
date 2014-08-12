PA_OUNIT_VERSION    = 109.53.00
CORE_KERNEL_VERSION = 111.25.00

default: build

build/pa_ounit.ml:
	mkdir -p build
	curl -s "https://raw.githubusercontent.com/janestreet/pa_ounit/$(PA_OUNIT_VERSION)/syntax/pa_ounit.ml" > $@

build/pa_ounit_fix.ml: build/pa_ounit.ml
	perl -ne 'if (/^  <:str_item</../^  >>/) { if (/^  <:str_item<|^  >>/) { print } } else { print }' < $^ > $@

build/pa_ounit.cmo: build/pa_ounit_fix.ml
	ocamlfind ocamlc -syntax camlp4o -package camlp4.extend,camlp4.lib,camlp4.quotations -linkpkg -c $^ -o $@

.PHONY: package
package:
	@if [ ! -d build/core_kernel ]; then \
	    mkdir -p build && \
	    cd build && \
	    echo "Cloning core_kernel repository..." && \
	    git clone "https://github.com/janestreet/core_kernel.git" && \
	    cd core_kernel && \
	    echo "Checkouting $(CORE_KERNEL_VERSION)..." && \
	    git checkout -b work "$(CORE_KERNEL_VERSION)^" && \
	    echo "Fixing _oasis..." && \
	    sed -e 's/core_kernel/core_kernel_js/' _oasis \
	        | awk '/^(Library check_caml_modify|Executable|Test)/, /^$$/ { next } { print }' \
	        > tmp && \
	    mv tmp _oasis && \
	    echo "Forcing x86 architecture..." && \
	    LANG=C sed -ie 's/ ARCH_SIXTYFOUR/ NO_ARCH_SIXTYFOUR/' lib/*.c lib/*.ml lib/*.mli && \
	    LANG=C sed -ie '/assert (Int.num_bits = 31)/d' lib/pool.ml; \
	fi

.PHONY: build
build: package build/pa_ounit.cmo
	pa_ounit="$$(pwd)/build/pa_ounit.cmo" && \
	cd build/core_kernel && \
	make setup-dev.exe setup.data && \
	./setup-dev.exe -build -cflags "-ppopt,$$pa_ounit"

.PHONY: install
install:
	cd build/core_kernel && make install

.PHONY: clean
clean:
	rm -rf build
