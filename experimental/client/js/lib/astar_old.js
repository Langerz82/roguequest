
define(function() {

    var AStar = (function () {
      /**
       * A* (A-Star) algorithm for a path finder
       * @author  Andrea Giammarchi
       * @license Mit Style License
       */

    var asGridCellSize = 16;

    var asCols = 0;
    var asRows = 0;

    function diagonalSuccessors($N, $S, $E, $W, N, S, E, W, grid, result, i) {
        if($N) {
            $E && !grid[N][E] && (result[i++] = {x:E, y:N});
            $W && !grid[N][W] && (result[i++] = {x:W, y:N});
        }
        if($S){
            $E && !grid[S][E] && (result[i++] = {x:E, y:S});
            $W && !grid[S][W] && (result[i++] = {x:W, y:S});
        }
        return result;
    }

    function diagonalSuccessorsFree($N, $S, $E, $W, N, S, E, W, grid, result, i) {
        $N = N > -1;
        $S = S < asRows;
        $E = E < asCols;
        $W = W > -1;
        if($E) {
            $N && !grid[N][E] && (result[i++] = {x:E, y:N});
            $S && !grid[S][E] && (result[i++] = {x:E, y:S});
        }
        if($W) {
            $N && !grid[N][W] && (result[i++] = {x:W, y:N});
            $S && !grid[S][W] && (result[i++] = {x:W, y:S});
        }
        return result;
    }

    function nothingToDo($N, $S, $E, $W, N, S, E, W, grid, result, i) {
        return result;
    }

    function successors(find, x, y, grid){
        var result = [],
            i = 0;

        if (x <= -1 || x >= asCols || y <= -1 || y >= asRows)
          return [];

        var X = Math.floor(x),
            Y = Math.floor(y),
            Ny = (Y - 1),
            Ex = (X + 1),
            Sy = (Y + 1),
            Wx = (X - 1),
            $N, $S, $E, $W;

        if (x >= 0 && x <= (asCols-1))
        {
          $N = Ny >= 0 && !grid[Ny][X];
          $S = Sy <= (asRows-1) && !grid[Sy][X];
        }

        if (y >= 0 && y <= (asRows-1))
        {
          $E = Ex <= (asCols-1) && !grid[Y][Ex];
          $W = Wx >= 0  && !grid[Y][Wx];
        }

        $N && (result[i++] = {x:X, y:Ny});
        $E && (result[i++] = {x:Ex, y:Y});
        $S && (result[i++] = {x:X, y:Sy});
        $W && (result[i++] = {x:Wx, y:Y});

        return find($N, $S, $E, $W, Ny, Sy, Ex, Wx, grid, result, i);
    }

    function diagonal(start, end, f1, f2) {
        return f2(f1(start.x - end.x), f1(start.y - end.y));
    }

    function euclidean(start, end, f1, f2) {
        var x = start.x - end.x,
            y = start.y - end.y;

        return f2(x * x + y * y);
    }

    function manhattan(start, end, f1, f2) {
        return f1(start.x - end.x) + f1(start.y - end.y);
    }

    function getRelativeCoords(c1, c2)
    {
        var x, y;

        x = Math.floor(c1[0]/asGridCellSize);
        y = Math.floor(c1[1]/asGridCellSize);

        return [x, y];
    }

    function AStar(grid, start, end, f) {
        asCols = grid[0].length;
        asRows = grid.length;

        var rcs = [start[0]/asGridCellSize, start[1]/asGridCellSize];
        if (grid[Math.floor(rcs[1])][Math.floor(rcs[0])])// ||
            //grid[Math.ceil(rcs[1])][Math.ceil(rcs[0])])
        {
          return null;
        }

        var start2 = {x:rcs[0], y:rcs[1],
                      f:0, g:0, v:rcs[0] + rcs[1]*asCols};
        var limit = (asCols * asRows),
            f1 = Math.abs,
            f2 = Math.max,
            list = {},
            result = [],
            open = [start2],
            length = 1,
            adj, distance, find, i, j, max, min, current, next;

        var rce = [end[0]/asGridCellSize, end[1]/asGridCellSize];
        var rce2 = getRelativeCoords(end, start);
        if (grid[rce2[1]][rce2[0]])
          return null;

        // Check if path points outside of grid, if so exit function.
        if (rcs[0] < 0 || rcs[0] >= asCols ||
            rcs[1] < 0 || rcs[1] >= asRows ||
            rce[0] < 0 || rce[0] >= asCols ||
            rce[1] < 0 || rce[1] >= asRows)
        {
          return null;
        }

        var end2 = {x:rce2[0], y:rce2[1],
                    f:0, g:0, v:rce2[0] + rce2[1]*asCols};


        switch (f) {
            case "Diagonal":
                find = diagonalSuccessors;
            case "DiagonalFree":
                distance = diagonal;
                break;
            case "Euclidean":
                find = diagonalSuccessors;
            case "EuclideanFree":
                f2 = Math.sqrt;
                distance = euclidean;
                break;
            default:
                distance = manhattan;
                find = nothingToDo;
                break;
        }

        find || (find = diagonalSuccessorsFree);

        do {
            max = limit;
            min = 0;
            for(i = 0; i < length; ++i) {
                if((f = open[i].f) < max) {
                    max = f;
                    min = i;
                }
            }

            current = open.splice(min, 1)[0];

            var diffEndX = Math.abs(current.x - rce[0]),
                diffEndY = Math.abs(current.y - rce[1]);

            if (diffEndX < 1 && diffEndY < 1)
            {
              current.x = rce[0];
              current.y = rce[1];
              current.v = end2.v;

              if (!current.hasOwnProperty('p'))
                break;

              // This section joins the end of the path to the found path
              // only if it's different values but in the same grid cell.
              var tmp = {};
              var insertTemp = false;
              tmp.x = rce[0];
              tmp.y = rce[1];
              var diffX = Math.abs(rce[0]-current.p.x),
                  diffY = Math.abs(rce[1]-current.p.y);
              if (diffX > 0 && diffX < 1)
              {
                tmp.x = current.p.x;
                insertTemp = true;
              }
              else if (diffY > 0 && diffY < 1)
              {
                tmp.y = current.p.y;
                insertTemp = true;
              }
              if (insertTemp) {
                tmp.v = (tmp.x) + (tmp.y) * asCols;
                tmp.p = current.p;
                current.p = tmp;
              }
            }

            if (current.v != end2.v) {
                --length;

                var diffEndX = Math.abs(current.x - rce[0]),
                    diffEndY = Math.abs(current.y - rce[1]);

                if (diffEndX < 1 && diffEndY == 0)
                {
                  current.x = rce[0];
                }
                else if (diffEndX == 0 && diffEndY < 1)
                {
                  current.y = rce[1];
                }

                next = successors(find, current.x, current.y, grid);
                for(i = 0, j = next.length; i < j; ++i){
                    (adj = next[i]).p = current;
                    adj.f = adj.g = 0;
                    adj.v = (adj.x) + (adj.y) * asCols;
                    if(!(adj.v in list)){
                        adj.f = (adj.g = current.g + distance(adj, current, f1, f2)) + distance(adj, end2, f1, f2);
                        open[length++] = adj;
                        list[adj.v] = 1;
                    }
                }
            } else {
              i = 0;
              length = 0;
              do {
                  result[i++] = [current.x*asGridCellSize,
                                 current.y*asGridCellSize];
              } while (current = current.p);
              result.reverse();
            }
        } while (length);

        //log.info(JSON.stringify(result));

        // Remove redundant coords in the result list.
        for (var i=2; i < (result.length); ++i)
        {
          if ((Math.abs(result[i-2][0] - result[i][0]) > 0 &&
               Math.abs(result[i-2][1] - result[i][1]) == 0) ||
              (Math.abs(result[i-2][1] - result[i][1]) > 0  &&
               Math.abs(result[i-2][0] - result[i][0]) == 0))
          {
            result.splice(--i,1);
          }
        }

        //log.info(JSON.stringify(result));
        return result;
      }

      return {AStar};

      }());

      return AStar;
  });
