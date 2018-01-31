import jQuery from "jquery";
import chai from "chai";

(($, assert) => {
    class Callback
    {
        protected invoked: number = 0;
        protected callback: () => any;

        constructor(callback: () => any)
        {
            this.callback = callback;
        }

        invoke()
        {
            this.callback.apply(this, arguments);
            this.invoked++;
        }

        getInvoked(): number
        {
            return this.invoked;
        }
    }

    class Utils
    {
        static createCallbacks(): { [key: string]: Callback }
        {
            return {
                a: new Callback(() => {}),
                b: new Callback(() => {}),
                div: new Callback(() => {})
            };
        }

        static invokeCallbacks(callbacks: { [key: string]: Callback })
        {
            return function (this: Element) {
                callbacks[this.tagName.toLowerCase()].invoke();
            };
        }

        static assertInvoked(
            callbacks: { [key: string]: Callback },
            a: number,
            b: number,
            div: number,
            prefix?: string
        ): void {
            assert.equal(callbacks.a.getInvoked(), a, (prefix ? prefix + ': ' : '') + 'Callback #a must be invoked ' +
                a + ' time(s) total');
            assert.equal(callbacks.b.getInvoked(), b, (prefix ? prefix + ': ' : '') + 'Callback #b must be invoked ' +
                b + ' time(s) total');
            assert.equal(callbacks.div.getInvoked(), div, (prefix ? prefix + ': ' : '') + 'Callback #div must be' +
                ' invoked ' + div + ' time(s) total');
        }

        static wait(frames: number, callback: () => any): void
        {
            if (frames <= 0) {
                callback();
            } else {
                setTimeout(() => {
                    Utils.wait(frames - 1, callback);
                }, 1);
            }
        }
    }

    let $body: jQuery,
        $fixture: jQuery,
        $a: jQuery,
        $b: jQuery,
        $div: jQuery;

    beforeEach(() => {
        $fixture = $('<div/>');
        $a = $('<a/>');
        $b = $('<b/>');
        $div = $('<div/>');
        $body = $(document.body);
        $body.append($fixture);
    });

    afterEach(() => {
        $fixture.remove();
    });

    describe('jQuery.Always', () => {
        it('Dependencies have resolved', () => {
            // in safari 8 & some ios MutationObserver is an object, not a function
            let mo = typeof (<any> window).MutationObserver,
                wmo = typeof (<any> window).WebKitMutationObserver;
            assert.isTrue('undefined' !== mo || 'undefined' !== wmo, 'Browser must support mutation observer feature,' +
                ' typeof MutationObserver is ' + mo + ', typeof WebKitMutationObserver is ' + wmo);
        });

        it('Plugin has registered', () => {
            assert.isFunction((<any> $.fn).always, 'always() must be registered with jQuery');
            assert.isFunction((<any> $.fn).never, 'never() must be registered with jQuery');
        });

        it('"Inserted" callbacks are executed for matching selectors (before registration)', (done: MochaDone) => {
            let callbacks = Utils.createCallbacks();

            $fixture
                .append($a)
                .append($b)
                .append($div)
                .always('a, b', Utils.invokeCallbacks(callbacks));

            Utils.wait(1, () => {
                Utils.assertInvoked(callbacks, 1, 1, 0);
                done();
            });
        });

        it('"Inserted" callbacks are executed for matching selectors (after registration)', (done: MochaDone) => {
            let callbacks = Utils.createCallbacks();

            $fixture
                .always('a, b', Utils.invokeCallbacks(callbacks))
                .append($a)
                .append($b)
                .append($div);

            Utils.wait(1, () => {
                Utils.assertInvoked(callbacks, 1, 1, 0);
                done();
            });
        });

        it('"Removed" callbacks are executed for matching selectors', (done: MochaDone) => {
            let callbacks = Utils.createCallbacks();

            $fixture
                .append($a)
                .append($b)
                .append($div)
                .always('a, b', undefined, Utils.invokeCallbacks(callbacks));

            $a.remove();
            $b.remove();

            Utils.wait(1, () => {
                Utils.assertInvoked(callbacks, 1, 1, 0);
                done();
            });
        });

        it('Callbacks are also executed for selectors matching children (deep) of mutated' +
            ' elements', (done: MochaDone) => {
            let insertedCallbacks = Utils.createCallbacks(),
                removedCallbacks = Utils.createCallbacks();

            $fixture
                .always('a, b', Utils.invokeCallbacks(insertedCallbacks), Utils.invokeCallbacks(removedCallbacks))
                .append('<a></a><a><b></b></a><a></a><b></b><div><a></a><a><b></b></a><b></b></div>');

            Utils.wait(1, () => {
                Utils.assertInvoked(insertedCallbacks, 5, 4, 0);
                Utils.assertInvoked(removedCallbacks, 0, 0, 0);

                $fixture.html('');

                Utils.wait(1, () => {
                    Utils.assertInvoked(insertedCallbacks, 5, 4, 0);
                    Utils.assertInvoked(removedCallbacks, 5, 4, 0);

                    done();
                });
            });
        });

        it('Callbacks are not called multiple times for special cases (like wrap()) where the element is already' +
            ' in the Dom', (done: MochaDone) => {
            let insertedCallbacks = Utils.createCallbacks(),
                removedCallbacks = Utils.createCallbacks();

            $fixture
                .append($a)
                .always('a', Utils.invokeCallbacks(insertedCallbacks), Utils.invokeCallbacks(removedCallbacks));

            Utils.wait(1, () => {
                Utils.assertInvoked(insertedCallbacks, 1, 0, 0);
                Utils.assertInvoked(removedCallbacks, 0, 0, 0);

                $a.wrap('<div/>');

                Utils.wait(1, () => {
                    Utils.assertInvoked(insertedCallbacks, 2, 0, 0);
                    Utils.assertInvoked(removedCallbacks, 1, 0, 0);

                    done();
                });
            });
        });

        it('Callbacks are not called multiple times for special cases (like wrap() / unwrap()) where child nodes' +
            ' are also reported as mutated', (done: MochaDone) => {
            let insertedCallbacks = Utils.createCallbacks(),
                removedCallbacks = Utils.createCallbacks(),
                $aWrapper = $('<span/>');

            // 1 addition from append()
            $fixture
                .always('a', Utils.invokeCallbacks(insertedCallbacks), Utils.invokeCallbacks(removedCallbacks))
                .append($a);

            Utils.wait(1, () => {
                Utils.assertInvoked(insertedCallbacks, 1, 0, 0);
                Utils.assertInvoked(removedCallbacks, 0, 0, 0);

                // 1 removal + 1 addition from wrap()
                $a.wrap($aWrapper);

                Utils.wait(1, () => {
                    Utils.assertInvoked(insertedCallbacks, 2, 0, 0);
                    Utils.assertInvoked(removedCallbacks, 1, 0, 0);

                    // 1 removal + 1 addition from unwrap()
                    $a.unwrap();

                    Utils.wait(1, () => {
                        Utils.assertInvoked(insertedCallbacks, 3, 0, 0);
                        Utils.assertInvoked(removedCallbacks, 2, 0, 0);

                        done();
                    });
                });
            });
        });

        it('Calling never() stops execution of all callbacks', (done: MochaDone) => {
            let insertedCallbacks = Utils.createCallbacks(),
                removedCallbacks = Utils.createCallbacks();

            $fixture
                .always('a, b', Utils.invokeCallbacks(insertedCallbacks), Utils.invokeCallbacks(removedCallbacks))
                .append($a)
                .append($b)
                .append($div);

            Utils.wait(1, () => {
                Utils.assertInvoked(insertedCallbacks, 1, 1, 0, 'Pre-Never (Inserted)');

                $a.remove();
                $b.remove();
                $div.remove();

                Utils.wait(1, () => {
                    Utils.assertInvoked(removedCallbacks, 1, 1, 0, 'Pre-Never (Removed)');

                    $fixture
                        .never()
                        .append($a)
                        .append($b)
                        .append($div);

                    Utils.wait(1, () => {
                        Utils.assertInvoked(insertedCallbacks, 1, 1, 0, 'Post-Never (Inserted)');

                        $a.remove();
                        $b.remove();
                        $div.remove();

                        Utils.wait(1, () => {
                            Utils.assertInvoked(removedCallbacks, 1, 1, 0, 'Post-Never (Removed)');
                            done();
                        });
                    });
                });
            });
        });

        it('Calling never(selector) stops execution of matching callbacks', (done: MochaDone) => {
            let callbacksAB = Utils.createCallbacks(),
                callbacksDIV = Utils.createCallbacks();

            $fixture
                .always('a, b', Utils.invokeCallbacks(callbacksAB))
                .always('div', Utils.invokeCallbacks(callbacksDIV))
                .append($a)
                .append($b)
                .append($div);

            Utils.wait(1, () => {
                Utils.assertInvoked(callbacksAB, 1, 1, 0, 'Pre-Never (A,B)');
                Utils.assertInvoked(callbacksDIV, 0, 0, 1, 'Pre-Never (DIV)');

                $a.remove();
                $b.remove();
                $div.remove();

                $fixture
                    .never('b,a') // this will also test selector normalization
                    .append($a)
                    .append($b)
                    .append($div);

                Utils.wait(1, () => {
                    Utils.assertInvoked(callbacksAB, 1, 1, 0, 'Post-Never (A,B)');
                    Utils.assertInvoked(callbacksDIV, 0, 0, 2, 'Post-Never (DIV)');

                    done();
                });
            });
        });

        it('Calling never(selector, insertedCallback, removedCallback) stops execution of exact callback(s)',
            (done: MochaDone) => {
            let callbacksInsertedA = Utils.createCallbacks(),
                callbacksInsertedB = Utils.createCallbacks(),
                callbacksRemovedDIV = Utils.createCallbacks(),
                _callbacksInsertedA = Utils.invokeCallbacks(callbacksInsertedA),
                _callbacksInsertedB = Utils.invokeCallbacks(callbacksInsertedB),
                _callbacksRemovedDIV = Utils.invokeCallbacks(callbacksRemovedDIV);

            $fixture
                .always('a', _callbacksInsertedA)
                .always('b', _callbacksInsertedB)
                .always('div', undefined, _callbacksRemovedDIV)
                .append($a)
                .append($b)
                .append($div);
            $div.remove();

            Utils.wait(1, () => {
                Utils.assertInvoked(callbacksInsertedA, 1, 0, 0, 'Pre-Never (A)');
                Utils.assertInvoked(callbacksInsertedB, 0, 1, 0, 'Pre-Never (B)');
                Utils.assertInvoked(callbacksRemovedDIV, 0, 0, 1, 'Pre-Never (DIV)');

                $a.remove();
                $b.remove();

                $fixture
                    .never('a', _callbacksInsertedA)
                    .append($a)
                    .append($b)
                    .append($div);
                $div.remove();

                Utils.wait(1, () => {
                    Utils.assertInvoked(callbacksInsertedA, 1, 0, 0, 'Post-Never (A)');
                    Utils.assertInvoked(callbacksInsertedB, 0, 2, 0, 'Post-Never (B)');
                    Utils.assertInvoked(callbacksRemovedDIV, 0, 0, 2, 'Post-Never (DIV)');

                    $a.remove();
                    $b.remove();

                    $fixture
                        .never('div', undefined, _callbacksRemovedDIV)
                        .append($a)
                        .append($b)
                        .append($div);
                    $div.remove();

                    Utils.wait(1, () => {
                        Utils.assertInvoked(callbacksInsertedA, 1, 0, 0, 'Post-Never (A)');
                        Utils.assertInvoked(callbacksInsertedB, 0, 3, 0, 'Post-Never (B)');
                        Utils.assertInvoked(callbacksRemovedDIV, 0, 0, 2, 'Post-Never (DIV)');
                        done();
                    });
                });
            });
        });

        it('Adding a second "inserted" callback eligible for immediate execution does not trigger re-execution of' +
            ' the first one', (done: MochaDone) => {
            let callbacks = Utils.createCallbacks();

            $fixture
                .append($a.attr('data-ab', ''))
                .append($b.attr('data-ab', ''))
                .append($div)
                .always('a', Utils.invokeCallbacks(callbacks))
                .always('[data-ab]', Utils.invokeCallbacks(callbacks));

            Utils.wait(1, () => {
                Utils.assertInvoked(callbacks, 2, 1, 0);
                done();
            });
        });

        it('Issuing multiple additions / removals invokes registered callbacks in a reasonable amount of time',
            (done: MochaDone) => {
            let iteration = 1000,
                elapsed = 0,
                time = 0,
                callback = () => {
                    elapsed += new Date().getTime() - time;

                    if (0 === iteration--) {
                        assert.isBelow(elapsed, 1000);
                        return done();
                    }

                    let $els = $fixture.find('a, em, strong, span, div'),
                        go = 0 < $els.length && 0.5 > Math.random() ?
                            () => $els.first().remove() :
                            () => $fixture.append('<' + ['a', 'em', 'strong', 'span', 'div'][Math.round(Math.random() *
                                4)] + '/>');

                    time = new Date().getTime();
                    go();
                };

            $fixture.always('a, em, strong, span, div', callback, callback);

            time = new Date().getTime();
            callback();
        });
    });
})(jQuery, chai.assert);