// TODO: Figure out what with done() method
// TODO: Set up imports routing
// TODO: get rid of jquery
// TODO: Think about nojquery (and ssr etc)

import $ from '../../../node_modules/jquery';
import QUERY from '../../../artfacts/npm/devextreme/data/query';

// TODO: Fix error handling tests
// import ErrorHandlingHelper from '../../helpers/data.errorHandlingHelper.js';

describe('Misc', () => {

    test('no operations', function() {
        expect.assertions(2);

        // const done = assert.async();
        const q = QUERY([1, 2, 3]);

        $.when(
            q.enumerate().done(function(r) {
                expect(r).toEqual([1, 2, 3]); // 'first enumeration'
            })
        ).done(function() {
            q.enumerate().done(function(r) {
                expect(r).toEqual([1, 2, 3]); // 'second enumeration'
            // done();
            });
        });
    });

    test('toArray convenience method', function() {
        expect(
            QUERY([1, 2, 3])
                .select(function(i) { return i * 2; })
                .toArray()
        ).toEqual(
            [2, 4, 6]
        );
    });


});
describe('Sorting', () => {

    test('basic usage', function() {
        expect.assertions(1);

        // const done = assert.async();

        const input = [
            { name: 'alex', age: 21 },
            { name: 'bob', age: 0 },
            { name: 'alex', age: 27 }
        ];

        const output = [
            { name: 'alex', age: 27 },
            { name: 'alex', age: 21 },
            { name: 'bob', age: 0 }
        ];

        QUERY(input).sortBy('name').thenBy('age', 'desc').enumerate().done(function(r) {
            expect(r).toEqual(output);
        // done();
        });
    });

    test('sort using functional getter', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [2, 1, 3];
        const output = [3, 2, 1];

        QUERY(input).sortBy(function(item) { return 3 - item; }).enumerate().done(function(r) {
            expect(r).toEqual(output);
        // done();
        });
    });

    test('sort using compare function', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [2, 1, 3];
        const output = [3, 1, 2];

        QUERY(input).sortBy('this', false, function(x, y) {
            return output.indexOf(x) - output.indexOf(y);
        }).enumerate().done(function(r) {
            expect(r).toEqual(output);
        // done();
        });
    });

    test('thenBy with compare function', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [2, 1, 3];
        const output = [3, 1, 2];

        QUERY(input).sortBy('fake').thenBy('this', false, function(x, y) {
            return output.indexOf(x) - output.indexOf(y);
        }).enumerate().done(function(r) {
            expect(r).toEqual(output);
        // done();
        });
    });

    test('sort using compare function and getter', function() {
        expect.assertions(1);

        // const done = assert.async();
        const order = [2, 1];
        const input = [{ val: 1 }, { val: 2 }];
        const output = [{ val: 2 }, { val: 1 }];

        QUERY(input).sortBy('val', false, function(x, y) {
            return order.indexOf(x) - order.indexOf(y);
        }).enumerate().done(function(r) {
            expect(r).toEqual(output);
        // done();
        });
    });

    test('sort using compare function if desc is true', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [2, 1, 3];
        const output = [3, 1, 2];

        QUERY(input).sortBy('this', true, function(x, y) {
            return output.indexOf(x) - output.indexOf(y);
        }).enumerate().done(function(r) {
            expect(r).toEqual(output.slice().reverse());
        // done();
        });
    });

    test('compare function arguments should not be normalized via toComparable', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = ['A', 'a', 'B'];
        const output = ['A', 'B', 'a'];

        QUERY(input).sortBy('this', false, function(x, y) {
            if(x < y) return -1;
            if(x > y) return 1;
            return 0;
        }).enumerate().done(function(r) {
            expect(r).toEqual(output);
        // done();
        });
    });

    test('sort without a getter', function() {
        expect.assertions(1);

        // const done = assert.async();

        QUERY([2, 1]).sortBy().enumerate().done(function(r) {
            expect(r).toEqual([1, 2]);
        // done();
        });
    });

    test('applying sort does not modify original query', function() {
        expect.assertions(2);

        // const done = assert.async();
        const q = QUERY([2, 1]);
        const sorted = q.sortBy();

        // $.when(
        q.enumerate().done(function(r) {
            expect(r).toEqual([2, 1]);
        }),
        sorted.enumerate().done(function(r) {
            expect(r).toEqual([1, 2]);
        });
    // ).done(done);
    });

    test('subsequent \'sort\' call re-sorts from scratch', function() {
        expect.assertions(1);

        // const done = assert.async();
        const data = [2, 1, 3];
        let q = QUERY(data);

        q = q.sortBy(function(i) { return i; });
        q = q.sortBy(function(i) { return 10 - i; });
        q.enumerate().done(function(r) {
            expect(r).toEqual([3, 2, 1]);
        // done();
        });
    });

    test('sort uses getter', function() {
        expect.assertions(1);

        // const done = assert.async();
        const data = [new Date(2011, 11, 22), new Date(2011, 10, 1)];
        QUERY(data).sortBy('getMonth').enumerate().done(function(r) {
            expect(r[0].getMonth()).toBe(10);
        // done();
        });
    });

    test('string are supported and letter case is ignored', function() {
    // const done = assert.async();
        const data = ['Z', 'a'];
        QUERY(data).sortBy().enumerate().done(function(r) {
            expect(r).toEqual(['a', 'Z']);
        // done();
        });
    });

    test('sort with falsy null and undefined values', function() {
    // NOTE: http://www.ecma-international.org/ecma-262/6.0/#sec-sortcompare
        let data;
        const sort = function(data, desc) {
            return QUERY(data)
                .sortBy('this', desc || false)
                .toArray();
        };

        data = ['b', null, undefined, 'a', null];
        expect(sort(data)).toEqual([null, null, 'a', 'b', undefined]);
        expect(sort(data, true)).toEqual([undefined, 'b', 'a', null, null]);

        data = [0, 1, null, -1, undefined, null];
        expect(sort(data)).toEqual([null, null, -1, 0, 1, undefined]);
        expect(sort(data, true)).toEqual([undefined, 1, 0, -1, null, null]);
    });

    test('sorting is stable (T123921)', function() {
    // const done = assert.async();

        const data = [
            { name: 0, type: 'M' },
            { name: 1, type: 'M' },
            { name: 2, type: 'M' },
            { name: 3, type: 'M' },
            { name: 4, type: 'M' },
            { name: 5, type: 'M' },
            { name: 6, type: 'M' },
            { name: 7, type: 'S' },
            { name: 9, type: 'S' },
            { name: 10, type: 'S' },
            { name: 11, type: 'S' }
        ];

        QUERY(data).sortBy('type').enumerate().done(function(r) {
            expect(r).toEqual(data);
        // done();
        });
    });

});
describe('Filtering', () => {

    test('filter by function', function() {
        expect.assertions(3);

        // const done = assert.async();
        const input = [2, 0, 5];

        const q1 = QUERY(input).filter(function(i) { return i > 1; });
        const q2 = q1.filter(function(i) { return i < 5; });

        $.when(
            q1.enumerate().done(function(r) {
                expect(r).toEqual([2, 5]);
            })
        ).done(function() {
            $.when(
                q2.enumerate().done(function(r) {
                    expect(r).toEqual([2]);
                }),
                q1.enumerate().done(function(r) {
                    expect(r).toEqual([2, 5]); // 'prev result has not been modified'
                })
            ).done(function() {
            // done();
            });
        });
    });

    test('group criterion with function', function() {
        expect.assertions(2);

        const data = [
            { value: 0 },
            { value: 2 },
            { value: 5 }
        ];
        const functionCondition = (itemData) => itemData.value > 1;
        const arrayCondition = ['value', '<', 5];

        expect(
            QUERY(data).filter([functionCondition, arrayCondition]).toArray()[0].value
        ).toBe(2);

        expect(
            QUERY(data).filter([arrayCondition, functionCondition]).toArray()[0].value
        ).toBe(2);
    });

    test('comparison operators', function() {
        expect.assertions(6);

        // const done = assert.async();
        const input = [{ f: 1 }, { f: 2 }];

        const check = function(crit, expectation) {
            return QUERY(input).filter(crit).enumerate().done(function(r) {
                expect(r).toEqual(expectation);
            });
        };

        $.when(
            check(['f', '=', 2], [{ f: 2 }]),
            check(['f', '<>', 2], [{ f: 1 }]),
            check(['f', '>', 1], [{ f: 2 }]),
            check(['f', '>=', 2], [{ f: 2 }]),
            check(['f', '<', 2], [{ f: 1 }]),
            check(['f', '<=', 1], [{ f: 1 }])
        ).done(function() {
        // done();
        });
    });

    test('filter with functional getter', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 1 }, { f: 2 }];
        const getter = function(obj) { return obj.f * 2; };

        QUERY(input).filter([getter, '=', 4]).enumerate().done(function(r) {
            expect(r).toEqual([{ f: 2 }]);
        // done();
        });
    });

    test('missing operation means equal', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 42 }];


        QUERY(input).filter(['f', 42]).enumerate().done(function(r) {
            expect(r).toEqual(input);
        // done();
        });
    });

    test('missing value means true', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: true }];

        QUERY(input).filter(['f']).enumerate().done(function(r) {
            expect(r).toEqual(input);
        // done();
        });
    });

    test('skip null and undefined values for string field', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: null }, { f: undefined }, { f: 'abc' }];

        QUERY(input).filter(['f', 'contains', 'b']).enumerate().done(function(r) {
            expect(r).toEqual([{ f: 'abc' }]);
        // done();
        });
    });

    test('when arguments are not array', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 42 }];

        QUERY(input).filter('f', 42).enumerate().done(function(r) {
            expect(r).toEqual(input);
        // done();
        });
    });

    test('AND', function() {
        expect.assertions(4);

        // const done = assert.async();
        const input = [{ f: 1 }, { f: 2 }, { f: 3 }];
        const cond1 = ['f', '>', 1];
        const cond2 = ['f', '<', 3];

        const check = function(op) {
            return QUERY(input)
                .filter([cond1, op, cond2])
                .enumerate()
                .fail(function() {
                    expect(false).toBe(true);// 'Shouldn\'t reach this point'
                })
                .done(function(r) {
                    expect(r).toEqual([{ f: 2 }]);
                });
        };

        $.when(
            check('and'),
            check('AND'),
            check('&'),
            check('&&')
        ).done(function() {
        // done();
        }).fail(function() {
            expect(false).toBe(true); // 'Shouldn\'t reach this point'
        });
    });

    test('OR', function() {
        expect.assertions(4);

        // const done = assert.async();
        const input = [{ f: 1 }, { f: 2 }, { f: 3 }];
        const cond1 = ['f', 1];
        const cond2 = ['f', 3];

        const check = function(op) {
            return QUERY(input).filter([cond1, op, cond2]).enumerate().done(function(r) {
                expect(r).toEqual([{ f: 1 }, { f: 3 }]);
            });
        };

        $.when(
            check('or'),
            check('OR'),
            check('|'),
            check('||')
        ).done(function() {
        // done();
        });
    });

    test('missing logic operator means AND', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 1 }, { f: 2 }, { f: 3 }];
        const crit = [
            ['f', '>', 1],
            ['f', '<', 3]
        ];

        QUERY(input).filter(crit).enumerate().done(function(r) {
            expect(r).toEqual([{ f: 2 }]);
        // done();
        });
    });

    test('conditions are not checked if it\'s not necessary', function() {
        expect.assertions(2);

        // const done = assert.async();

        const check = function(op) {
            let callCount = 0;

            return QUERY([{ f: 1 }, { f: 2 }])
                .filter([['f', '>', 1], op, function() {
                    callCount++;
                }])
                .enumerate()
                .done(function(r) {
                    expect(callCount).toBe(1);
                });
        };

        // $.when(
        check('and'),
        check('or');
    // ).done(done);
    });


    test('string functions', function() {
        expect.assertions(4);

        // const done = assert.async();
        const input = [{ f: 'a' }, { f: 'ab' }, { f: 'abc' }];


        const check = function(crit, expectation) {
            return QUERY(input).filter(crit).enumerate().done(function(r) {
                expect(r).toEqual(expectation);
            });
        };

        // $.when(
        check(['f', 'startsWith', 'ab'], [{ f: 'ab' }, { f: 'abc' }]),
        check(['f', 'endsWith', 'b'], [{ f: 'ab' }]),
        check(['f', 'contains', 'b'], [{ f: 'ab' }, { f: 'abc' }]),
        check(['f', 'notContains', 'b'], [{ f: 'a' }]);
    // ).done(done);
    });

    test('operator names are case insensitive', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 'abc' }];

        QUERY(input).filter('f', 'CoNtAiNs', 'b').enumerate().done(function(r) {
            expect(r).toEqual(input);
        // done();
        });
    });

    test('letter case in string values does not matter', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 'Abc' }];

        QUERY(input).filter(['f', 'aBc']).enumerate().done(function(r) {
            expect(r).toEqual(input);
        // done();
        });
    });

    test('date', function() {
        expect.assertions(1);

        // const done = assert.async();

        const ms = new Date().valueOf();
        const input = [
            { d: new Date(ms) },
            { d: new Date(ms + 5) }
        ];

        QUERY(input).filter(['d', new Date(ms)]).enumerate().done(function(r) {
            expect(r).toEqual([{ d: new Date(ms) }]);
        // done();
        });
    });

    test('filter uses getter', function() {
        expect.assertions(1);

        // const done = assert.async();
        const data = [new Date(2011, 11, 22), new Date(2011, 10, 1)];

        QUERY(data).filter('getMonth', 10).enumerate().done(function(r) {
            expect(r[0].getMonth()).toBe(10);
        // done();
        });
    });

    test('filter array and func regression', function() {
    // const done = assert.async();

        QUERY([1, 2, 3])
            .filter([
                ['this', '>', 1],
                function(i) { return i < 3; }
            ])
            .enumerate()
            .done(function(r) {
                expect(r).toEqual([2]);
            // done();
            });
    });

    test('T141181: Filtering with \'endswith\' operation is not working properly in some cases', function() {
    // const done = assert.async();

        QUERY(['bar'])
            .filter(['this', 'endswith', 'fooo'])
            .enumerate()
            .done(function(r) {
                expect(r).toEqual([]);
            // done();
            });
    });
    // TODO: Fix test

    // eslint-disable-next-line jest/no-commented-out-tests
    // test('unknown filter operation', function() {
    //     try {
    //         QUERY([1]).filter('a', 'nonsense', 'b');
    //         expect(false).toBe(true);
    //     } catch(x) {
    //         const result = /unknown filter/i.test(x.message);
    //         expect(result).toBe(true);
    //     }
    // });

    test('NOT with binary operators', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 'a' }, { f: 'ab' }, { f: 'abc' }];
        const cond = ['f', 'startswith', 'ab'];

        const check = function(op) {
            return QUERY(input)
                .filter([op, cond])
                .enumerate()
                .fail(function() {
                    expect(false).toBe(true);// 'Shouldn\'t reach this point'
                })
                .done(function(r) {
                    expect(r).toEqual([{ f: 'a' }]);
                });
        };

        $.when(
            check('!')
        ).done(function() {
        // done();
        }).fail(function() {
            expect(false).toBe(true); // 'Shouldn\'t reach this point'
        });
    });

    test('NOT with group operation', function() {
        expect.assertions(1);

        // const done = assert.async();
        const input = [{ f: 1 }, { f: 2 }, { f: 3 }];
        const cond1 = ['f', '>=', 2];
        const cond2 = ['f', '<>', 3];

        const check = function(op) {
            return QUERY(input)
                .filter([op, [cond1, 'and', cond2]])
                .enumerate()
                .fail(function() {
                    expect(false).toBe(true); // 'Shouldn\'t reach this point'
                })
                .done(function(r) {
                    expect(r).toEqual([{ f: 1 }, { f: 3 }]);
                });
        };

        $.when(
            check('!')
        ).done(function() {
        // done();
        }).fail(function() {
            expect(false).toBe(true);// 'Shouldn\'t reach this point'
        });
    });

    test('mixin and/or conditions inside a single group throws', function() {
        expect.assertions(4);

        function createFn(crit) {
            return function() {
                QUERY([{ foo: true, bar: true, foobar: true }])
                    .filter(crit)
                    .enumerate();
            };
        }

        expect(createFn([
            ['foo'],
            ['bar'],
            'or',
            ['foobar']
        ])).toThrow();

        expect(createFn([
            ['foo'],
            '&&',
            ['bar'],
            '||',
            ['foobar']
        ])).toThrow();

        expect(createFn([
            ['foo'],
            'or',
            ['bar'],
            ['foobar']
        ])).toThrow();

        expect(createFn([
            ['foo'],
            'or',
            ['bar'],
            'and',
            ['foobar']
        ])).toThrow();
    });

});
describe('Grouping', () => {

    test('basic usage', function() {
    // const done = assert.async();

        const input = [
            { a: 2 },
            { a: 1 },
            { a: 2 }
        ];

        QUERY(input).groupBy('a').enumerate().done(function(groups) {
            expect(groups).toEqual([
                {
                    key: 2,
                    items: [{ a: 2 }, { a: 2 }]
                },
                {
                    key: 1,
                    items: [{ a: 1 }]
                }
            ]);
        // done();
        });

    });

    test('group uses getter', function() {
        expect.assertions(1);

        // const done = assert.async();
        const data = [new Date(2011, 10, 1)];

        QUERY(data).groupBy('getMonth').enumerate().done(function(groups) {
            expect(groups[0].key).toBe(10);
        // done();
        });
    });

    test('T348632: Rows in a group with an undefined group value are not sorted', function() {

        const data = [
            { foo: undefined, bar: 1 },
            { foo: undefined, bar: 2 },
            { foo: null, bar: 1 },
            { foo: null, bar: 2 },
            { foo: 'a', bar: 1 },
            { foo: 'a', bar: 2 }
        ];

        expect(
            QUERY(data).sortBy('foo').thenBy('bar', true).toArray()
        ).toEqual(
            [
                { foo: null, bar: 2 },
                { foo: null, bar: 1 },
                { foo: 'a', bar: 2 },
                { foo: 'a', bar: 1 },
                { foo: undefined, bar: 2 },
                { foo: undefined, bar: 1 }
            ]
        );
    });

});
describe('Aggregates', () => {

    test('custom aggregate with 3 args', function() {
        expect.assertions(1);

        // const done = assert.async();

        QUERY([{ f: 1 }, { f: 2 }]).aggregate(
            0,
            function(accumulator, obj) { return accumulator += obj.f; },
            function(accumulator) { return accumulator * 2; }
        ).done(function(r) {
            expect(r).toBe(6);
        // done();
        });
    });

    test('custom aggregate with 1 args', function() {
        expect.assertions(1);

        // const done = assert.async();
        QUERY([1, 2])
            .aggregate(function(accumulator, obj) {
                return accumulator += obj;
            })
            .done(function(r) {
                expect(r).toBe(3);
            // done();
            });
    });

    test('standard aggregate functions', function() {
        expect.assertions(6);

        // const done = assert.async();
        const q = QUERY([{ f: 1 }, { f: 3 }]);

        $.when(
            q.count().done(function(r) {
                expect(r).toBe(2, 'countable count');
            }),

            q.filter(function(i) { return i.f < 2; })
                .count()
                .done(function(r) {
                    expect(r).toBe(1, 'non-countable count');
                }),

            q.sum('f').done(function(r) {
                expect(r).toBe(4);
            }),

            q.min('f').done(function(r) {
                expect(r).toBe(1);
            }),

            q.max('f').done(function(r) {
                expect(r).toBe(3);
            }),

            q.avg('f').done(function(r) {
                expect(r).toBe(2);
            })
        ).done(function() {
        // done();
        });
    });

    test('standard aggregate functions on empty collections', function() {
    // const done = assert.async();
        const q = QUERY([]);

        // $.when(

        q.count().done(function(r) {
            expect(r).toStrictEqual(0);
        }),

        q.filter(function() { return true; }).count().done(function(r) {
            expect(r).toStrictEqual(0);
        }),

        q.sum().done(function(r) {
            expect(r).toStrictEqual(0);
        }),

        q.min().done(function(r) {
            expect(r).toEqual(NaN);
        }),

        q.max().done(function(r) {
            expect(r).toEqual(NaN);
        }),

        q.avg().done(function(r) {
            expect(r).toEqual(NaN);
        });

    // ).done(done);
    });

});
describe('Select', () => {

    test('select', function() {
        expect.assertions(1);

        // const done = assert.async();

        QUERY([42])
            .select(function(obj) { return obj - 41; })
            .enumerate()
            .done(function(r) {
                expect(r).toEqual([1]);
            // done();
            });
    });

    test('select with prop name list', function() {
    // const done = assert.async();

        const data = [
            { a: 'A', b: 'B', c: 'C' }
        ];

        // $.when(

        QUERY(data).select('a', 'c', 'missing').enumerate().done(function(r) {
            expect(r).toEqual([{ a: 'A', c: 'C' }]);
        }),

        QUERY(data).select(['a', 'c']).enumerate().done(function(r) {
            expect(r).toEqual([{ a: 'A', c: 'C' }]);
        });

    // ).done(done);
    });

    test('select single property returns object', function() {
    // const done = assert.async();
        const data = [{ a: 'A' }];

        QUERY(data)
            .select('a')
            .enumerate()
            .done(function(r) {
                expect(r).toEqual(data);
            // done();
            });
    });

});
describe('Slice', () => {

    test('slice', function() {
        expect.assertions(3);

        // const done = assert.async();
        const q = QUERY([1, 2, 3]);

        // $.when(

        q.slice(-1, 1).enumerate().done(function(r) {
            expect(r).toEqual([1]);
        }),

        q.slice(2).enumerate().done(function(r) {
            expect(r).toEqual([3]);
        }),

        q.slice(1, 100).enumerate().done(function(r) {
            expect(r).toEqual([2, 3]);
        });

    // ).done(done);
    });

    test('slice reset method', function() {
        expect.assertions(2);

        // const done = assert.async();
        const q = QUERY([1, 2, 3]).slice(1, 1);

        $.when(
            q.enumerate().done(function(r) {
                expect(r).toEqual([2]);
            })
        ).done(function() {
            q.enumerate().done(function(r) {
                expect(r).toEqual([2]); // 'reset iterator'
            // done();
            });
        });
    });
});
// eslint-disable-next-line jest/no-commented-out-tests
// describe('Error handling', () => {
// eslint-disable-next-line jest/no-commented-out-tests
//     test('error handlers (enumerate)', function() {
//         const helper = new ErrorHandlingHelper();

//         helper.run(function() {
//             return QUERY([1], { errorHandler: helper.optionalHandler })
//                 .select(function() { throw Error('test'); })
//                 .enumerate();
//         }, assert.async(), assert);
//     });
// eslint-disable-next-line jest/no-commented-out-tests
//     test('error handlers (aggregate)', function() {
//         const helper = new ErrorHandlingHelper();

//         helper.run(function() {
//             return QUERY([1, 2, 3], { errorHandler: helper.optionalHandler })
//                 .aggregate(function() { throw Error('test'); });
//         }, assert.async(), assert);
//     });
// });

describe('Regression tests', () => {

    test('re-enumeration of changed data (sorting)', function() {
        // const done = assert.async();
        const data = [2, 1];
        const q = QUERY(data).sortBy();

        $.when(
            q.enumerate()
        ).done(function() {
            data.splice(0, Number.MAX_VALUE, 5, 3);
            q.enumerate().done(function(r) {
                expect(r).toEqual([3, 5]);
                // done();
            });
        });
    });

    test('re-enumeration of changed data (grouping)', function() {
        // const done = assert.async();
        const data = [1, 2, 3];
        const q = QUERY(data).groupBy();

        $.when(
            q.enumerate()
        ).done(function() {
            data.splice(0, Number.MAX_VALUE, 9, 9);
            q.enumerate().done(function(g) {
                expect(g.length).toBe(1);
                expect(g[0].key).toBe(9);
                // done();
            });
        });
    });

    test('special for javascript cases (filtering)', function() {
        // const done = assert.async();
        const data = ['', 0, false, undefined, null];
        const query = QUERY(data);

        $.when(
            query.filter(['this', 0]).enumerate().done(function(r) {
                expect(r.length).toBe(1);
                expect(r[0]).toBe(0);
            }),

            query.filter(['this', '']).enumerate().done(function(r) {
                expect(r.length).toBe(1);
                expect(r[0]).toBe('');
            }),

            query.filter(['this', false]).enumerate().done(function(r) {
                expect(r.length).toBe(1);
                expect(r[0]).toBe(false);
            }),

            query.filter(['this', null]).enumerate().done(function(r) {
                expect(r.length).toBe(2);
                // TODO: Solve
                // expect(r[0]).toBeNull();
            }),

            query.filter(['this', undefined]).enumerate().done(function(r) {
                expect(r.length).toBe(2);
                expect(r[0]).toBe(undefined);
            })
        ).done(function() {
            // done();
        });
    });
});
