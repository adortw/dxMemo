$(function() {
    $('#sales').dxPivotGrid({
        allowExpandAll: true,
        showBorders: true,
        fieldChooser: {
            enabled: false,
        },
        dataSource: {
            fields: [{
                caption: 'vaccine',
                width: 100,
                dataField: 'vaccine',
                area: 'row',
            }, {
                dataField: 'county',
                   area: 'column',
                   expanded: true,
             }, {
                 dataField: 'period',
                 width: 80,
                dataType: 'string',
                area: 'column',
            }, {
                caption: 'amount',
                dataField: 'amount',
                dataType: 'number',
                summaryType: 'sum',
                area: 'data',
                calculateSummaryValue: function (e) { 
                    //console.log(e.parent("column"));
                    //console.log(e.children("column"));	
                    var isGrandRowTotalCell = e.parent("column");
                    //console.log(isGrandRowTotalCell); //true
                    if (isGrandRowTotalCell) {
                        //console.log(e);	//m
                        //console.log(e.children("column"));	//Array(2)
                        let arr = e.children("column"); //arr[0] & arr[1]
                        if (arr.length > 0) {
                            //for (let i = 0; i < arr.length; i++){
                            //    console.log(arr[i]._cell[0]);
                            //}
                            return arr[1]._cell[0] - arr[0]._cell[0]; //12ды-11ды
                        }
                    }
                    return e.value();
                },
            }],
            store: data,
        },
        onContentReady: function (e) {
            e.element.find(".dx-pivotgrid-horizontal-headers .dx-row-total span").text(function (index, curContent) {
                //console.log(curContent);
                return(curContent.replace("Total", "Growing"));
            });
        },
    });
});
