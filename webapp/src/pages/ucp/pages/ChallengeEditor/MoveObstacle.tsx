import Obstacle from "../../../../api/entities/Obstacle";
import {Box, Grid, Input, Slider, Theme} from "@material-ui/core";
import * as React from "react";
import useMapEditor from "../../../../hooks/useMapEditor";
import useCreateObstacle from "../../../../api/useCreateObstacle";
import useUpdateObstacle from "../../../../api/useUpdateObstacle";
import {useEffect, useRef, useState} from "react";
import {Segment} from "../../../../api/entities/Segment";
import L, {DomEvent, LatLng} from "leaflet";
import {calculateCoordOnPolyline} from "../../../../utils/orthonormalCalculs";
import {useRouter} from "../../../../hooks/useRouter";
import {useMap, useMapEvents} from "react-leaflet";
import {useQueryClient} from "react-query";
import useChallenge from "../../../../api/useChallenge";
import clsx from "clsx";
import {makeStyles} from "@material-ui/core/styles";
import LeafletControlPanel from "../../components/Leaflet/LeafletControlPanel";

const useStyles = makeStyles((theme: Theme) => ({
  slider: {
    margin: '0 auto',
  }
}))

export default function MoveObstacle() {
  const classes = useStyles()
  const router = useRouter()
  let challengeId = parseInt(router.query.id)

  const map = useMap()
  const {selectedObject, setSelectedObject} = useMapEditor()

  const queryClient = useQueryClient()

  const challenge = useChallenge(challengeId)

  /************************
   **  Obstacle Creation **
   ************************/
  const updateObstacle = useUpdateObstacle()
  const [obstacleDistance, setObstacleDistance] = useState<number | string | Array<number | string>>(selectedObject instanceof Obstacle ? selectedObject.attributes.position*100 : 0)
  const [obstaclePos, setObstaclePos] = useState<LatLng>(L.latLng(0, 0))

  useEffect(() => {
    console.log(selectedObject)
  }, [])

  const handleSliderObstacleChange = (event: Event, newValue: number | number[]) => {
    map.dragging.disable()
    if (selectedObject instanceof Obstacle) {
      setObstacleDistance(newValue)
      const previousObstacles = queryClient.getQueryData<Obstacle[]>(['obstacles', selectedObject.attributes.segmentId])
      if (previousObstacles) {
        const obstacleToUpdate = previousObstacles.find(obstacle => selectedObject.id == obstacle.id)
        if (obstacleToUpdate) {
          obstacleToUpdate.attributes.position = Number(newValue) / 100
          const indexToUpdate = previousObstacles.findIndex(obstacle => selectedObject.id == obstacle.id)

          previousObstacles[indexToUpdate] = obstacleToUpdate

          queryClient.setQueryData<Obstacle[]>(['obstacles', selectedObject.attributes.segmentId], previousObstacles)
        }
      }
    }
  }

  const handleSliderObstacleChangeCommitted = (event: object, value: number | number[]) => {
    setObstacleDistance(value)
    //setSelectedObject(prevState => new Obstacle({...prevState?.attributes, position: Number(value) / 100}, prevState?.id))
    map.dragging.enable()

    if (selectedObject instanceof Obstacle) {
      updateObstacle.mutate({
        id: selectedObject.id!,
        riddle: selectedObject.attributes.riddle,
        response: selectedObject.attributes.response,
        segmentId: selectedObject.attributes.segmentId,
        position: Number(value) / 100
      }, {
        onSuccess(data) {
          // if (sliderRef && sliderRef.current) {
          //   L.DomEvent.disableClickPropagation(sliderRef.current)
          //   setSelectedObject(data)
          // }
        },
      })
    }


  }

  const handleInputObstacleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedObject instanceof Obstacle) {
      setObstacleDistance(event.target.value === '' ? '' : Number(event.target.value))
      selectedObject.attributes.position = Number(event.target.value)
    }
  }

  const handleInputObstacleBlur = () => {
    if (selectedObject instanceof Segment) {
      if (obstacleDistance < 0) {
        setObstacleDistance(0);
      } else if (obstacleDistance > selectedObject.attributes.length) {
        setObstacleDistance(selectedObject.attributes.length);
      }
    }
  }

  useEffect(() => {
    if (selectedObject instanceof Segment && challenge.isSuccess) {
      let point = calculateCoordOnPolyline(selectedObject.attributes.coordinates, Number(obstacleDistance)/challenge.data.attributes.scale)

      if (point) {
        let latLng = L.latLng(point.y, point.x)
        setObstaclePos(latLng)
      }
    }
  }, [obstacleDistance])

  const sliderRef = useRef<HTMLSpanElement>(null)

  return (
    <LeafletControlPanel>
    <div>
        <Box sx={{width: 250}}>
            <Grid
                container
                spacing={2}
                alignItems="center"
                sx={{
                  backgroundColor: 'white',
                }}
            >
                <Grid item xs>
                    <Slider
                      ref={sliderRef}
                      value={typeof obstacleDistance === 'number' ? obstacleDistance : 0}
                      step={0.1}
                      max={100}
                      onChange={handleSliderObstacleChange}
                      onChangeCommitted={handleSliderObstacleChangeCommitted}
                      aria-labelledby="input-slider"
                    />
                </Grid>
                <Grid item>
                    <Input
                        value={obstacleDistance}
                        size="small"
                        onClick={() => {
                          console.log("input click");
                        }}
                        onChange={handleInputObstacleChange}
                        onBlur={handleInputObstacleBlur}
                        inputProps={{
                          step: 0.1,
                          min: 0,
                          max: 100,
                          type: 'number',
                          'aria-labelledby': 'input-slider',
                        }}
                    />
                </Grid>
            </Grid>
        </Box>
    </div>
    </LeafletControlPanel>

  )
}