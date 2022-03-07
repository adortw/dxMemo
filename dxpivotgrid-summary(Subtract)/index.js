$(function() {
    $('#sales').dxPivotGrid({
        allowSortingBySummary: true,
        allowSorting: true,
        allowFiltering: true,
        allowExpandAll: true,
        height: 440,
        showBorders: true,
        fieldChooser: {
            enabled: false,
        },
        dataSource: {
            fields: [{
                caption: 'Region',
                width: 120,
                dataField: 'region',
                area: 'row',
            }, {
                caption: 'City',
                dataField: 'city',
                width: 150,
                area: 'row',
                selector: function(data) {
                    return data.city+"("+data.country+")";
                },
            }, {
                dataField: 'month',
                dataType: 'string',
                area: 'column',
            }, {
                caption: 'Sales1',
                dataField: 'amount1',
                dataType: 'number',
                summaryType: 'sum',
                area: 'data',
            },{
                caption: 'Sales',
                dataField: 'amount',
                dataType: 'number',
                summaryType: 'sum',
                area: 'data',
                calculateSummaryValue: function (e) {
                    var isGrandRowTotalCell = !e.parent("column");
                    console.log(isGrandRowTotalCell);
                    if (isGrandRowTotalCell) {
                        console.log(e);
                        console.log(e.children("column"));
                        let arr = e.children("column");
                        if(arr.length >0)
                        {
                            for (let i = 0; i < arr.length; i++)
                                console.log(arr[i]._cell[1]);
                            return arr[1]._cell[1] - arr[0]._cell[1];
                        }
                    }
                    return e.value();
                },
            }],
            store: sales,
        },
    });
});
