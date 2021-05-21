import {Checkpoint} from "../../../../api/entities/Checkpoint";
import L, {LatLng, LatLngExpression, LeafletMouseEvent} from "leaflet";
import {useCheckpoints} from "../../../../api/useCheckpoints";
import {Segment} from "../../../../api/entities/Segment";
import MarkerColors from "../../components/Leaflet/marker-colors";
import * as React from "react";
import {Marker, Polyline, useMapEvents} from "react-leaflet";
import useMapEditor from "../../../../hooks/useMapEditor";
import {useQueryClient} from "react-query";
import {useState} from "react";
import useUpdateCheckpoint from "../../../../api/useUpdateCheckpoint";
import {Menu, MenuItem, PopoverPosition} from "@material-ui/core";
import useCreateSegment from "../../../../api/useCreateSegment";
import useDeleteCheckpoint from "../../../../api/useDeleteCheckpoint";
import {IPoint} from "@acrobatt";
import {calculateDistanceBetweenCheckpoint} from "../../../../utils/orthonormalCalculs";
import useDeleteSegment from "../../../../api/useDeleteSegment";
import {useRouter} from "../../../../hooks/useRouter";

type Props = {
  draggable: boolean
}

const Checkpoints = (props: Props) => {
  const {
    draggable,
  } = props

  const router = useRouter()
  let challengeId = parseInt(router.query.id)
  const checkpointsList = useCheckpoints(challengeId)

  const queryClient = useQueryClient()
  const {selectedObject, setSelectedObject} = useMapEditor()

  /*****************************
   **  Checkpoint management  **
   *****************************/
  const [checkpointClicked, setCheckpointClicked] = useState<Checkpoint | null>(null)
  const updateCheckpoint = useUpdateCheckpoint()
  const [polyline, setPolyline] = useState<LatLngExpression[]>([]);
  const [anchorPosition, setAnchorPosition] = useState<PopoverPosition>({top: 0, left: 0});
  const [openMenu, setOpenMenu] = useState(false);
  const [isCreateSegmentClicked, setIsCreateSegmentClicked] = useState(false)
  const [checkpointStart, setCheckpointStart] = useState<Checkpoint | null>(null)
  const createSegmentMutation = useCreateSegment()
  const deleteCheckpoint = useDeleteCheckpoint()

  const deleteSegment = useDeleteSegment()
  const handleDeleteSegment = () => {
    setOpenMenu(false)

    if (selectedObject instanceof Segment) {
      deleteSegment.mutate(selectedObject.id!, {
        onSuccess() {
          queryClient.invalidateQueries(['checkpoints', challengeId])
          queryClient.invalidateQueries(['segments', challengeId])
        }
      })
      setSelectedObject(null)
    }
  }

  useMapEvents({
    click(e) {
      setCheckpointClicked(null)
      if (polyline.length > 0) {
        setPolyline(prevState => [...prevState, e.latlng])
      }
    },
    mousemove(e) {
      if (polyline.length > 0) {
        let updatedPolylineArray = [...polyline]
        updatedPolylineArray[polyline.length - 1] = e.latlng
        setPolyline(updatedPolylineArray)
      }
    },
    keydown(e) {
      if (e.originalEvent.key == 'Delete') {
        if (selectedObject instanceof Checkpoint) handleDeleteCheckpoint()
        if (selectedObject instanceof Segment) handleDeleteSegment()
      }
    }
  })

  const handleCheckpointContextMenu = (e: LeafletMouseEvent, checkpoint: Checkpoint) => {
    let x = e.originalEvent.clientX
    let y = e.originalEvent.clientY
    setAnchorPosition({top: y, left: x})
    setOpenMenu(true)
    setCheckpointClicked(checkpoint)
  }

  const handleCheckpointClick = (e: LeafletMouseEvent, checkpoint: Checkpoint) => {
    setSelectedObject(checkpoint)

    if (isCreateSegmentClicked) {
      if (polyline.length > 0 && checkpointStart) {
        const coords: IPoint[] = polyline.map((value) => {
          //@ts-ignore
          return {x: value.lng, y: value.lat}
        })

        coords.pop() // Pop last inserted point by mousemove
        coords.push({x: e.latlng.lng, y: e.latlng.lat}) // Insert point coordinate of the clicked checkpoint

        const length = calculateDistanceBetweenCheckpoint(coords, 100)

        if (checkpointStart.id && checkpoint.id) {
          createSegmentMutation.mutate({
            name: "Segment",
            coordinates: coords,
            length,
            checkpointStartId: checkpointStart.id,
            checkpointEndId: checkpoint.id,
            challengeId: challengeId
          }, {
            onSettled: (data) => {
              setPolyline([])
              setIsCreateSegmentClicked(false)
              setCheckpointClicked(null)
            }
          })
        }
      }
    }
  }

  const handleCreateSegment = () => {
    if (checkpointClicked) {
      setIsCreateSegmentClicked(true)
      setOpenMenu(false)

      let latLng = L.latLng(checkpointClicked.attributes.coordinate.y, checkpointClicked.attributes.coordinate.x)
      setPolyline([latLng, latLng])
      setCheckpointStart(checkpointClicked)
    }
  }

  const handleDeleteCheckpoint = () => {
    setOpenMenu(false)

    if (selectedObject instanceof Checkpoint) {
      deleteCheckpoint.mutate(selectedObject.id!, {
        onSuccess() {
          queryClient.invalidateQueries(['checkpoints', challengeId])
          queryClient.invalidateQueries(['segments', challengeId])
        }
      })
      setSelectedObject(null)
    }
  }

  return (
    <>
      {
        checkpointsList.isSuccess && (
          checkpointsList.data.map((checkpoint, index, array) => {
            let latLng: LatLng = L.latLng(checkpoint.attributes.coordinate.y, checkpoint.attributes.coordinate.x)
            const handleDrag = (e: L.LeafletEvent) => {
              let newLatLng: LatLng = e.target.getLatLng()
              const previousSegments = queryClient.getQueryData<Segment[]>(['segments', challengeId])

              if (previousSegments) {
                let segmentStartsIds = checkpoint.attributes.segmentsStartsIds
                let segmentEndsIds = checkpoint.attributes.segmentsEndsIds

                segmentStartsIds.forEach(segmentId => {
                  let segmentStart = previousSegments.find(segment => segment.id == segmentId)
                  //console.log("Segment start: ", segmentStart)

                  if (segmentStart) {
                    segmentStart.attributes.coordinates[0] = {
                      x: newLatLng.lng,
                      y: newLatLng.lat,
                    }
                    const indexToUpdate = previousSegments.findIndex(segment => segmentId == segment.id)
                    previousSegments[indexToUpdate] = segmentStart
                  }
                })

                segmentEndsIds.forEach(segmentId => {
                  let segmentEnd = previousSegments.find(segment => segment.id == segmentId)
                  //console.log("Segment end: ", segmentEnd)

                  if (segmentEnd) {
                    segmentEnd.attributes.coordinates[segmentEnd.attributes.coordinates.length - 1] = {
                      x: newLatLng.lng,
                      y: newLatLng.lat,
                    }

                    const indexToUpdate = previousSegments.findIndex(segment => segmentId == segment.id)
                    previousSegments[indexToUpdate] = segmentEnd
                  }
                })

                const list = array
                list[index].attributes.coordinate.x = newLatLng.lng
                list[index].attributes.coordinate.y = newLatLng.lat
                queryClient.setQueryData<Segment[]>(['segments', challengeId], previousSegments)
                queryClient.setQueryData<Checkpoint[]>(['checkpoints', challengeId], list)
              }
            }

            const handleDragEnd = (e: L.DragEndEvent) => {
              const list = array
              let newLatLng: LatLng = e.target.getLatLng()
              list[index].attributes.coordinate.x = newLatLng.lng
              list[index].attributes.coordinate.y = newLatLng.lat

              //queryClient.setQueryData<Checkpoint[]>(['checkpoints', challengeId], list)
              updateCheckpoint.mutate({
                id: list[index].id!,
                position: list[index].attributes.coordinate,
                challengeId: challengeId,
                checkpointType: list[index].attributes.checkpointType,
                name: list[index].attributes.name,
              })

            }

            let icon = (checkpoint.attributes.checkpointType == "BEGIN"
              ? MarkerColors.greenIcon
              : checkpoint.attributes.checkpointType == "END"
                ? MarkerColors.redIcon :
                MarkerColors.blueIcon)

            if (selectedObject instanceof Checkpoint && selectedObject.id == checkpoint.id) {
              icon = (checkpoint.attributes.checkpointType == "BEGIN"
                ? MarkerColors.greenIconSelected
                : checkpoint.attributes.checkpointType == "END"
                  ? MarkerColors.redIconSelected :
                  MarkerColors.blueIconSelected)
            }

            if (checkpoint.id) {
              return (
                <React.Fragment key={checkpoint.id}>
                  {
                    <Marker
                      data-key={checkpoint.id}
                      draggable={draggable}
                      icon={icon}
                      position={latLng}
                      eventHandlers={{
                        drag: (e) => {
                          handleDrag(e)
                        },
                        dragstart: () => {
                          setSelectedObject(checkpoint)
                          console.log(checkpoint.id)
                          console.log("segment start", checkpoint.attributes.segmentsStartsIds)
                          console.log("segment end", checkpoint.attributes.segmentsEndsIds)
                        },
                        dragend: (e) => {
                          handleDragEnd(e)
                        },
                        contextmenu: (e) => {
                          handleCheckpointContextMenu(e, checkpoint)
                          setSelectedObject(checkpoint)
                        },
                        click: (e) => {
                          handleCheckpointClick(e, checkpoint)
                        },
                      }}
                    />
                  }
                </React.Fragment>
              )
            }
          })
        )
      }
      {polyline.length > 0 &&
      <Polyline
          positions={polyline}
      />
      }
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        id="simple-menu"
        open={openMenu}
        onClose={() => setOpenMenu(false)}
      >
        <MenuItem onClick={handleCreateSegment}>Créer un segment à partir de ce point</MenuItem>
        <MenuItem onClick={handleDeleteCheckpoint}>Supprimer le checkpoint</MenuItem>
      </Menu>
    </>
  )
}

export default Checkpoints